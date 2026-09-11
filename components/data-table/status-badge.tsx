import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  awaiting_payment: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  unpaid: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  paid: 'bg-green-100 text-green-800 hover:bg-green-100',
  failed: 'bg-red-100 text-red-800 hover:bg-red-100',
  active: 'bg-green-100 text-green-800 hover:bg-green-100',
  trial: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  inactive: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  expired: 'bg-red-100 text-red-800 hover:bg-red-100',
  suspended: 'bg-red-100 text-red-800 hover:bg-red-100',
  confirmed: 'bg-green-100 text-green-800 hover:bg-green-100',
  completed: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
  in_progress: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  no_show: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  reviewed: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  resolved: 'bg-green-100 text-green-800 hover:bg-green-100',
  dismissed: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '_')
  const label = status.replace(/_/g, ' ')

  return (
    <Badge
      variant="secondary"
      className={cn(
        'capitalize font-medium',
        statusStyles[normalized] ?? 'bg-muted text-muted-foreground',
        className
      )}
    >
      {label}
    </Badge>
  )
}
