'use client'

import { useEffect, useState } from 'react'
import { supabase, getAdminRecord, AdminUser } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, MessageSquare, BookOpen, UserCheck, CalendarCheck, ShieldCheck, KeyRound } from 'lucide-react'

interface InstitutionStats {
  member_count: number
  posts: number
  sessions: number
  completed_sessions: number
  completion_rate: number
  resources: number
  counsellors: number
  pct_feels_safe: number
  pct_less_alone: number
  pct_seek_support: number
}

export function InstitutionDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [institution, setInstitution] = useState<{
    name: string
    subscription_status: 'pending' | 'active' | 'trial' | 'inactive' | 'expired'
    invite_code: string | null
  } | null>(null)
  const [stats, setStats] = useState<InstitutionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const year = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(String(year))
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1))

  useEffect(() => {
    async function load() {
      const record = await getAdminRecord()
      if (!record?.institution_id) {
        setLoading(false)
        return
      }
      setAdmin(record)

      const { data: inst } = await supabase
        .from('institutions')
        .select('name, subscription_status, invite_code')
        .eq('id', record.institution_id)
        .single()

      setInstitution(inst || null)

      const { data, error } = await supabase.rpc('get_institution_dashboard_stats', {
        p_institution_id: record.institution_id,
        p_year: parseInt(selectedYear, 10),
        p_month: parseInt(selectedMonth, 10),
      })

      if (!error && data) {
        setStats(data as InstitutionStats)
      }
      setLoading(false)
    }

    load()
  }, [selectedYear, selectedMonth])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!admin?.institution_id) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No institution assigned to this admin account.
        </CardContent>
      </Card>
    )
  }

  const cards = [
    { title: 'Members', value: stats?.member_count ?? 0, icon: Users },
    { title: 'Institution Posts', value: stats?.posts ?? 0, icon: MessageSquare },
    { title: 'Resources', value: stats?.resources ?? 0, icon: BookOpen },
    { title: 'Support Providers', value: stats?.counsellors ?? 0, icon: UserCheck },
    {
      title: 'Sessions',
      value: stats?.sessions ?? 0,
      description: `${stats?.completed_sessions ?? 0} completed (${stats?.completion_rate ?? 0}%)`,
      icon: CalendarCheck,
    },
    {
      title: 'Feel Safe',
      value: `${stats?.pct_feels_safe ?? 0}%`,
      icon: ShieldCheck,
    },
    { title: 'Feel Less Alone', value: `${stats?.pct_less_alone ?? 0}%`, icon: ShieldCheck },
    { title: 'Seek Support', value: `${stats?.pct_seek_support ?? 0}%`, icon: ShieldCheck },
  ]
  const isPending = institution?.subscription_status === 'pending'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{institution?.name || 'Your institution'}</h1>
          <p className="text-muted-foreground">
            Institution dashboard — private community metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[year, year - 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Institution pending approval</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-900">
            Your dashboard is available while FAFA reviews your institution. The join code is hidden
            until a super admin approves the institution.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Join Code</CardTitle>
          <KeyRound className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isPending ? (
            <>
              <div className="text-2xl font-bold text-muted-foreground">Hidden</div>
              <p className="text-xs text-muted-foreground">Available after approval</p>
            </>
          ) : (
            <div className="font-mono text-2xl font-bold">
              {institution?.invite_code || 'Not generated'}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              {item.description && (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
