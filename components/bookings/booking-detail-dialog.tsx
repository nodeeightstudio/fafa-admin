'use client'

import { useState } from 'react'
import { BookingWithDetails } from '@/types/booking'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Calendar, Clock, User, Mail, Video, MessageSquare, Phone } from 'lucide-react'

interface BookingDetailDialogProps {
  booking: BookingWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: (bookingId: string, status: string, reason?: string) => Promise<void>
}

export function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
  onUpdateStatus
}: BookingDetailDialogProps) {
  const [cancellationReason, setCancellationReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!booking) return null

  const handleStatusUpdate = async (status: string) => {
    setLoading(true)
    await onUpdateStatus(booking.id, status, status === 'cancelled' ? cancellationReason : undefined)
    setLoading(false)
    setCancellationReason('')
  }

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />
      case 'chat':
        return <MessageSquare className="h-5 w-5" />
      case 'online':
        return <Phone className="h-5 w-5" />
      default:
        return null
    }
  }

  const counsellorInitials = booking.counsellor.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            Booking ID: {booking.id.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Counsellor Info */}
          <div>
            <h3 className="font-semibold mb-3">Counsellor</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={booking.counsellor.avatar_url || undefined} />
                <AvatarFallback>{counsellorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{booking.counsellor.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {booking.counsellor.specialties.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* User Info */}
          <div>
            <h3 className="font-semibold mb-3">User</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{booking.user.full_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{booking.user.email}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Session Details */}
          <div>
            <h3 className="font-semibold mb-3">Session Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(booking.scheduled_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {format(new Date(booking.scheduled_at), 'h:mm a')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getSessionIcon(booking.session_type)}
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{booking.session_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{booking.duration} minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Message */}
          {booking.message && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">User Message</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {booking.message}
                </p>
              </div>
            </>
          )}

          {/* Status */}
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <Badge className="text-sm">{booking.status}</Badge>
          </div>

          {/* Cancellation Info */}
          {booking.status === 'cancelled' && booking.cancellation_reason && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Cancellation Reason</h3>
                <p className="text-sm text-muted-foreground">{booking.cancellation_reason}</p>
                {booking.cancelled_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cancelled on {format(new Date(booking.cancelled_at), 'MMM dd, yyyy h:mm a')}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          {booking.status === 'pending' && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Actions</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusUpdate('confirmed')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Confirm Booking
                  </Button>
                </div>
              </div>
            </>
          )}

          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <>
              <div className="space-y-3">
                <Label htmlFor="cancellation_reason">Cancel Booking</Label>
                <Textarea
                  id="cancellation_reason"
                  placeholder="Reason for cancellation..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={3}
                />
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={loading || !cancellationReason.trim()}
                  className="w-full"
                >
                  Cancel Booking
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
