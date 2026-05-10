'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  CalendarCheck, 
  HeartHandshake,
  TrendingUp,
  Download
} from 'lucide-react'

interface SnapshotStats {
  total_registered_users: number
  new_users_30d: number
  total_posts: number
  total_interactions: number
  total_sessions: number
  completed_sessions: number
  safety_score: number
  support_score: number
  retention_rate: number
}

export function OverviewSnapshot() {
  const [stats, setStats] = useState<SnapshotStats | null>(null)
  const [externalMetrics, setExternalMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: snapshot } = await supabase
        .from('dashboard_analytics_snapshot')
        .select('*')
        .single()

      const { data: external } = await supabase
        .from('external_metrics')
        .select('*')

      setStats(snapshot)
      setExternalMetrics(external || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading || !stats) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="h-32 bg-gray-100" />
      ))}
    </div>
  }

  const getExternal = (id: string) => externalMetrics.find(m => m.id === id)?.value_text || '0'

  const snapshotItems = [
    {
      title: 'Total Downloads',
      value: getExternal('total_downloads'),
      description: 'App store installs',
      icon: Download,
      color: 'text-blue-500'
    },
    {
      title: 'Registered Users',
      value: stats.total_registered_users.toLocaleString(),
      description: `${stats.new_users_30d} in last 30 days`,
      icon: Users,
      color: 'text-purple-500'
    },
    {
      title: 'Anonymous Posts',
      value: stats.total_posts.toLocaleString(),
      description: 'Shared feelings',
      icon: MessageSquare,
      color: 'text-orange-500'
    },
    {
      title: 'Safety Score',
      value: `${stats.safety_score}%`,
      description: 'Users reporting feeling safe',
      icon: ShieldCheck,
      color: 'text-green-500'
    },
    {
      title: 'Counseling Sessions',
      value: stats.total_sessions.toLocaleString(),
      description: `${stats.completed_sessions} completed`,
      icon: CalendarCheck,
      color: 'text-pink-500'
    },
    {
      title: 'Peer Interactions',
      value: stats.total_interactions.toLocaleString(),
      description: 'Comments & Support',
      icon: HeartHandshake,
      color: 'text-indigo-500'
    },
    {
      title: 'Retention (30D)',
      value: `${stats.retention_rate}%`,
      description: 'Based on cohorts',
      icon: TrendingUp,
      color: 'text-cyan-500'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {snapshotItems.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
