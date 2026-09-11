'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Banknote, CalendarCheck, Clock, Layers, XCircle } from 'lucide-react'
import { COUNSELLOR_TIER_LABELS, formatGhs, pesewasToGhs } from '@/lib/session-pricing'

interface PaymentRow {
  amount_pesewas: number | null
  payment_status: string | null
  status: string | null
  paid_at: string | null
  counsellor: { tier: number } | { tier: number }[] | null
}

function counsellorTier(row: PaymentRow): number | null {
  const counsellor = Array.isArray(row.counsellor) ? row.counsellor[0] : row.counsellor
  return counsellor?.tier ?? null
}

export function PaymentStats() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('bookings')
        .select('amount_pesewas, payment_status, status, paid_at, counsellor:counsellors(tier)')

      if (error) {
        console.error('Failed to load payment stats', error)
        setRows([])
      } else {
        setRows((data || []) as PaymentRow[])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const stats = useMemo(() => {
    const paid = rows.filter((row) => row.payment_status === 'paid')
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalRevenue = paid.reduce((sum, row) => sum + pesewasToGhs(row.amount_pesewas), 0)
    const monthRevenue = paid
      .filter((row) => row.paid_at && new Date(row.paid_at) >= monthStart)
      .reduce((sum, row) => sum + pesewasToGhs(row.amount_pesewas), 0)

    const byTier: Record<number, number> = { 1: 0, 2: 0, 3: 0 }
    for (const row of paid) {
      const tier = counsellorTier(row)
      if (tier && byTier[tier] != null) {
        byTier[tier] += pesewasToGhs(row.amount_pesewas)
      }
    }

    return {
      totalRevenue,
      monthRevenue,
      paidSessions: paid.length,
      awaitingPayment: rows.filter((row) => row.status === 'awaiting_payment').length,
      expiredFailed: rows.filter(
        (row) => row.payment_status === 'expired' || row.payment_status === 'failed'
      ).length,
      byTier,
    }
  }, [rows])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[120px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-[80px]" />
              <Skeleton className="h-3 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const items = [
    {
      title: 'Total revenue',
      value: formatGhs(stats.totalRevenue),
      description: 'All successful Paystack payments',
      icon: Banknote,
    },
    {
      title: 'Revenue this month',
      value: formatGhs(stats.monthRevenue),
      description: 'Paid this calendar month',
      icon: CalendarCheck,
    },
    {
      title: 'Paid sessions',
      value: stats.paidSessions.toLocaleString(),
      description: 'Bookings with completed payment',
      icon: Layers,
    },
    {
      title: 'Awaiting payment',
      value: stats.awaitingPayment.toLocaleString(),
      description: 'In-flight checkouts (expire after 5 min)',
      icon: Clock,
    },
    {
      title: 'Expired / failed',
      value: stats.expiredFailed.toLocaleString(),
      description: 'Abandoned or failed payments',
      icon: XCircle,
    },
    {
      title: 'Revenue by tier',
      value: formatGhs(stats.totalRevenue),
      description: [1, 2, 3]
        .map((tier) => `${COUNSELLOR_TIER_LABELS[tier]} ${formatGhs(stats.byTier[tier])}`)
        .join(' · '),
      icon: Layers,
    },
  ]

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Payment stats</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
