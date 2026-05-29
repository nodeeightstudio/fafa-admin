'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
interface MonthlyStat {
  metric_name: string
  month_val: string
  stat_count: number
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function DashboardTracker() {
  const [stats, setStats] = useState<MonthlyStat[]>([])
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  const months =
    selectedMonth === 'all'
      ? MONTH_NAMES.map((m) => m)
      : [MONTH_NAMES[parseInt(selectedMonth, 10) - 1]]

  useEffect(() => {
    async function fetchMonthlyStats() {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_monthly_tracker_stats', {
        p_year: parseInt(selectedYear, 10),
        p_month: selectedMonth === 'all' ? null : parseInt(selectedMonth, 10),
      })

      if (error) {
        console.error('Error fetching monthly tracker stats:', error)
        setStats([])
      } else {
        setStats(data || [])
      }
      setLoading(false)
    }

    fetchMonthlyStats()
  }, [selectedYear, selectedMonth])

  const getVal = (metric: string, month: string) => {
    const stat = stats.find(
      (s) =>
        s.metric_name === metric &&
        s.month_val?.trim().toLowerCase() === month.trim().toLowerCase()
    )
    if (!stat) return '0'
    const n = Number(stat.stat_count)
    return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString()
  }

  const renderTable = (metrics: { id: string; label: string }[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[220px]">Metric</TableHead>
          {months.map((m) => (
            <TableHead key={m}>{m}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.label}</TableCell>
            {months.map((month) => (
              <TableCell key={month}>{getVal(m.id, month)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <CardTitle>Performance Tracker</CardTitle>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={name} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="growth">
          <TabsList className="mb-4 flex flex-wrap h-auto">
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="growth">
            {renderTable([
              { id: 'registered_users', label: 'Registered Users' },
              { id: 'mau', label: 'Monthly Active Users' },
              { id: 'app_downloads', label: 'App Downloads' },
              { id: 'retention_30d', label: '30-Day Retention (%)' },
            ])}
          </TabsContent>

          <TabsContent value="engagement">
            {renderTable([
              { id: 'posts_created', label: 'Anonymous Posts Created' },
              { id: 'peer_interactions', label: 'Peer Interactions' },
              { id: 'resource_views', label: 'Resource Views' },
              { id: 'sessions_per_user', label: 'Sessions per User per Month' },
            ])}
          </TabsContent>

          <TabsContent value="support">
            {renderTable([
              { id: 'sessions_booked', label: 'Counseling Sessions Booked' },
              { id: 'completed_sessions', label: 'Completed Sessions' },
              {
                id: 'counseling_completion_rate',
                label: 'Counseling Session Completion Rate (%)',
              },
            ])}
          </TabsContent>

          <TabsContent value="impact">
            {renderTable([
              { id: 'pct_feels_safe', label: '% Who Feel Safe Using FAFA' },
              { id: 'pct_less_alone', label: '% Who Feel Less Alone' },
              { id: 'pct_seek_support', label: '% Who Say FAFA Helped Them Seek Support' },
            ])}
          </TabsContent>

          <TabsContent value="revenue">
            {renderTable([
              { id: 'paying_users', label: 'Paying Users' },
              { id: 'monthly_revenue', label: 'Monthly Revenue' },
              { id: 'institutions_onboarded', label: '# Institutions Onboarded' },
            ])}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
