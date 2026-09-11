'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { supabase, isUserAdmin } from '@/lib/supabase'
import { BookingStatus, BookingWithDetails } from '@/types/booking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingDetailDialog } from '@/components/bookings/booking-detail-dialog'
import { getBookings, updateBookingStatus } from '@/lib/actions/bookings'
import { Calendar, MessageSquare, Phone, Video } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { StatusBadge } from '@/components/data-table/status-badge'
import { RowActions } from '@/components/data-table/row-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatGhs, pesewasToGhs } from '@/lib/session-pricing'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getSessionIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />
    case 'chat':
      return <MessageSquare className="h-4 w-4" />
    case 'online':
      return <Phone className="h-4 w-4" />
    default:
      return null
  }
}

function StatCard({
  label,
  value,
  loading,
  valueClassName,
}: {
  label: string
  value: number
  loading: boolean
  valueClassName?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className={`text-2xl font-bold ${valueClassName ?? ''}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  )
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const router = useRouter()

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBookings({
        status: activeTab !== 'all' ? activeTab : undefined,
      })
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const adminStatus = await isUserAdmin()
      if (!adminStatus) {
        toast.error('Access denied. Admin privileges required.')
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      fetchBookings()
    }
    checkAuth()
  }, [router, fetchBookings])

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking)
    setIsDetailDialogOpen(true)
  }

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus, reason?: string) => {
    try {
      await updateBookingStatus(bookingId, status, reason)
      setIsDetailDialogOpen(false)
      await fetchBookings()
      toast.success('Booking updated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update booking')
    }
  }

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  }

  const columns = useMemo(
    () => [
      {
        id: 'session',
        header: 'Session',
        cell: (booking: BookingWithDetails) => (
          <div className="flex items-center gap-3 min-w-[240px]">
            <Avatar className="h-9 w-9">
              <AvatarImage src={booking.counsellor.avatar_url || undefined} />
              <AvatarFallback>{getInitials(booking.counsellor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium leading-none">{booking.counsellor.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                with {booking.user.full_name || booking.user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        cell: (booking: BookingWithDetails) => (
          <div className="flex items-center gap-2 text-sm capitalize">
            {getSessionIcon(booking.session_type)}
            {booking.session_type} · {booking.duration}m
          </div>
        ),
      },
      {
        id: 'scheduled',
        header: 'Scheduled',
        cell: (booking: BookingWithDetails) => (
          <div className="text-sm">
            <p>{format(new Date(booking.scheduled_at), 'MMM d, yyyy')}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(booking.scheduled_at), 'h:mm a')}
            </p>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (booking: BookingWithDetails) => <StatusBadge status={booking.status} />,
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (booking: BookingWithDetails) => (
          <span className="text-sm">
            {booking.amount_pesewas != null ? formatGhs(pesewasToGhs(booking.amount_pesewas)) : '—'}
          </span>
        ),
      },
      {
        id: 'payment',
        header: 'Payment',
        cell: (booking: BookingWithDetails) =>
          booking.payment_status ? (
            <StatusBadge status={booking.payment_status} />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    []
  )

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Bookings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Track and manage counselling sessions</p>
          </div>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Total" value={counts.all} loading={loading} />
          <StatCard
            label="Pending"
            value={counts.pending}
            loading={loading}
            valueClassName="text-yellow-600"
          />
          <StatCard
            label="Confirmed"
            value={counts.confirmed}
            loading={loading}
            valueClassName="text-green-600"
          />
          <StatCard
            label="Completed"
            value={counts.completed}
            loading={loading}
            valueClassName="text-blue-600"
          />
          <StatCard
            label="Cancelled"
            value={counts.cancelled}
            loading={loading}
            valueClassName="text-red-600"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <DataTable
              title="Booking Sessions"
              description={
                activeTab === 'all'
                  ? 'All scheduled and completed counselling sessions.'
                  : `Showing ${activeTab.replace('_', ' ')} bookings.`
              }
              loading={loading}
              data={bookings}
              columns={columns}
              getRowId={(row) => row.id}
              emptyTitle="No bookings found"
              emptyDescription={
                activeTab === 'all'
                  ? 'Bookings will appear here once users start booking sessions.'
                  : `No ${activeTab} bookings at the moment.`
              }
              actions={(booking) => (
                <RowActions
                  actions={[
                    {
                      label: 'View details',
                      onClick: () => handleViewDetails(booking),
                    },
                    ...(booking.status === 'pending'
                      ? [
                          {
                            label: 'Confirm',
                            onClick: () => handleUpdateStatus(booking.id, 'confirmed'),
                          },
                        ]
                      : []),
                    ...(booking.status === 'confirmed'
                      ? [
                          {
                            label: 'Mark completed',
                            onClick: () => handleUpdateStatus(booking.id, 'completed'),
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            />
          </TabsContent>
        </Tabs>
      </div>

      <BookingDetailDialog
        booking={selectedBooking}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onUpdateStatus={handleUpdateStatus}
      />
    </>
  )
}
