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
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface MonthlyStat {
  metric_name: string
  month_val: string
  stat_count: number
}

export function DashboardTracker() {
  const [stats, setStats] = useState<MonthlyStat[]>([])
  const [loading, setLoading] = useState(true)
  
  // Calculate the last 3 months dynamically
  const months = [
    subMonths(new Date(), 2),
    subMonths(new Date(), 1),
    new Date()
  ].map(d => format(d, 'MMMM'))

  useEffect(() => {
    async function fetchMonthlyStats() {
      // Fetch data for the last 3 months
      const startDate = startOfMonth(subMonths(new Date(), 2))
      const endDate = endOfMonth(new Date())

      const { data, error } = await supabase.rpc('get_monthly_tracker_stats', {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
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
      s.month_val.trim().toLowerCase() === month.trim().toLowerCase()
    )
    return stat ? stat.stat_count.toLocaleString() : '0'
  }

  const renderTable = (metrics: { id: string, label: string }[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Metric</TableHead>
          {months.map(m => (
            <TableHead key={m}>{m}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.label}</TableCell>
            {months.map(month => (
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
              { id: 'peer_interactions', label: 'Peer Interactions' },
              { id: 'resource_views', label: 'Resource Views' }
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
