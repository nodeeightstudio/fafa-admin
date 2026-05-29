'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  MessageSquare,
  ShieldCheck,
  CalendarCheck,
  HeartHandshake,
  TrendingUp,
  Download,
  Sparkles,
  ThumbsUp,
} from 'lucide-react'

interface SnapshotStats {
  total_registered_users: number
  new_users_30d: number
  total_posts: number
  total_interactions: number
  total_sessions: number
  completed_sessions: number
  counseling_completion_rate: number
  safety_score: number
  less_alone_score: number
  support_score: number
  nps_score: number
  emotional_relief_score: number
  retention_rate: number
  institutions_onboarded: number
}

export function OverviewSnapshot() {
  const [stats, setStats] = useState<SnapshotStats | null>(null)
  const [externalMetrics, setExternalMetrics] = useState<{ id: string; value_text: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: snapshot } = await supabase
        .from('dashboard_analytics_snapshot')
        .select('*')
        .single()

      const { data: external } = await supabase.from('external_metrics').select('*')

      setStats(snapshot)
      setExternalMetrics(external || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[80px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getExternal = (id: string) =>
    externalMetrics.find((m) => m.id === id)?.value_text || '0'

  const snapshotItems = [
    {
      title: 'Emotional Relief Score',
      value: `${stats.emotional_relief_score ?? 0}%`,
      description: 'From mood logs (30 days)',
      icon: Sparkles,
      color: 'text-violet-500',
    },
    {
      title: 'NPS',
      value: `${stats.nps_score ?? 0}%`,
      description: 'Would recommend FAFA',
      icon: ThumbsUp,
      color: 'text-emerald-500',
    },
    {
      title: 'Total Downloads',
      value: getExternal('total_downloads'),
      description: 'App store installs',
      icon: Download,
      color: 'text-blue-500',
    },
    {
      title: 'Registered Users',
      value: stats.total_registered_users.toLocaleString(),
      description: `${stats.new_users_30d} in last 30 days`,
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: 'Anonymous Posts',
      value: stats.total_posts.toLocaleString(),
      description: 'Global feed posts',
      icon: MessageSquare,
      color: 'text-orange-500',
    },
    {
      title: 'Safety Score',
      value: `${stats.safety_score}%`,
      description: 'Users reporting feeling safe',
      icon: ShieldCheck,
      color: 'text-green-500',
    },
    {
      title: 'Counseling Sessions',
      value: stats.total_sessions.toLocaleString(),
      description: `${stats.completed_sessions} completed (${stats.counseling_completion_rate ?? 0}%)`,
      icon: CalendarCheck,
      color: 'text-pink-500',
    },
    {
      title: 'Peer Interactions',
      value: stats.total_interactions.toLocaleString(),
      description: 'Comments & reactions',
      icon: HeartHandshake,
      color: 'text-indigo-500',
    },
    {
      title: 'Retention (30D)',
      value: `${stats.retention_rate}%`,
      description: 'Based on cohorts',
      icon: TrendingUp,
      color: 'text-cyan-500',
    },
    {
      title: 'Institutions',
      value: String(stats.institutions_onboarded ?? 0),
      description: 'Partners onboarded',
      icon: Users,
      color: 'text-amber-500',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {snapshotItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
