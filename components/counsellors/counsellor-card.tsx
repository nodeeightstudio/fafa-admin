'use client'

import { Counsellor } from '@/types/counsellor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { Edit, Calendar, Trash2 } from 'lucide-react'

interface CounsellorCardProps {
  counsellor: Counsellor
  onDelete?: (id: string) => void
}

export function CounsellorCard({ counsellor, onDelete }: CounsellorCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'inactive':
        return 'bg-gray-500'
      case 'suspended':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const initials = counsellor.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={counsellor.avatar_url || undefined} alt={counsellor.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{counsellor.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${counsellor.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                {counsellor.is_online ? 'Online' : 'Offline'}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(counsellor.status)}>
            {counsellor.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Specialties */}
          <div>
            <p className="text-sm font-medium mb-1">Specialties</p>
            <div className="flex flex-wrap gap-1">
              {counsellor.specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {counsellor.specialties.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{counsellor.specialties.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Rating</p>
              <p className="font-semibold">
                {counsellor.average_rating.toFixed(1)} ⭐
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Sessions</p>
              <p className="font-semibold">{counsellor.total_sessions}</p>
            </div>
          </div>

          {/* Verification Badge */}
          {counsellor.is_verified && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              ✓ Verified
            </Badge>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/counsellors/${counsellor.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Link href={`/dashboard/counsellors/${counsellor.id}#availability`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Calendar className="h-4 w-4 mr-1" />
                Schedule
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(counsellor.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
