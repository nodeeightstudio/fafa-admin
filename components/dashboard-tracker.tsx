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

interface MonthlyStat {
  metric_name: string
  month_val: string
  stat_count: number
}

export function DashboardTracker() {
  const [stats, setStats] = useState<MonthlyStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMonthlyStats() {
      // Define the range for the tracker (e.g., April to June 2026)
      const { data, error } = await supabase.rpc('get_monthly_tracker_stats', {
        start_date: '2026-04-01',
        end_date: '2026-06-30'
      })

      if (error) {
        console.error('Error fetching monthly tracker stats:', error)
      } else {
        setStats(data || [])
      }
      setLoading(false)
    }

    fetchMonthlyStats()
  }, [])

  const getVal = (metric: string, month: string) => {
    const stat = stats.find(s => 
      s.metric_name === metric && 
      s.month_val.trim() === month
    )
    return stat ? stat.stat_count.toLocaleString() : '0'
  }

  const renderTable = (metrics: { id: string, label: string }[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Metric</TableHead>
          <TableHead>April</TableHead>
          <TableHead>May</TableHead>
          <TableHead>June</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.label}</TableCell>
            <TableCell>{getVal(m.id, 'April')}</TableCell>
            <TableCell>{getVal(m.id, 'May')}</TableCell>
            <TableCell>{getVal(m.id, 'June')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <Card className="col-span-3">
        <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Monthly Performance Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="growth">
          <TabsList className="mb-4">
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="growth">
            {renderTable([
              { id: 'registered_users', label: 'Registered Users' },
              { id: 'mau', label: 'Monthly Active Users' }
            ])}
          </TabsContent>
          
          <TabsContent value="engagement">
            {renderTable([
              { id: 'posts_created', label: 'Anonymous Posts Created' },
              { id: 'peer_interactions', label: 'Peer Interactions' }
            ])}
          </TabsContent>
          
          <TabsContent value="support">
            {renderTable([
              { id: 'sessions_booked', label: 'Counseling Sessions Booked' },
              { id: 'completed_sessions', label: 'Completed Sessions' }
            ])}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
