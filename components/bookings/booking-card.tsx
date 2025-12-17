'use client'

import { BookingWithDetails } from '@/types/booking'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { Calendar, Clock, User, Video, MessageSquare, Phone } from 'lucide-react'

interface BookingCardProps {
  booking: BookingWithDetails
  onViewDetails: (booking: BookingWithDetails) => void
  onUpdateStatus?: (bookingId: string, status: string) => void
}

export function BookingCard({ booking, onViewDetails, onUpdateStatus }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-blue-500'
      case 'cancelled':
        return 'bg-red-500'
      case 'in_progress':
        return 'bg-purple-500'
      case 'no_show':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getSessionIcon = (type: string) => {
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

  const userInitials = booking.user.full_name
    ? booking.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : booking.user.email.slice(0, 2).toUpperCase()

  const counsellorInitials = booking.counsellor.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.counsellor.avatar_url || undefined} />
                <AvatarFallback>{counsellorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{booking.counsellor.name}</p>
                <p className="text-sm text-muted-foreground">
                  with {booking.user.full_name || booking.user.email}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status}
            </Badge>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(booking.scheduled_at), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(booking.scheduled_at), 'h:mm a')}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {getSessionIcon(booking.session_type)}
              {booking.session_type}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {booking.duration} min
            </div>
          </div>

          {/* Message Preview */}
          {booking.message && (
            <div className="text-sm text-muted-foreground border-l-2 pl-3 italic">
              "{booking.message.slice(0, 100)}{booking.message.length > 100 ? '...' : ''}"
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails(booking)}
            >
              View Details
            </Button>
            {booking.status === 'pending' && onUpdateStatus && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onUpdateStatus(booking.id, 'confirmed')}
              >
                Confirm
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
