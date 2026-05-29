import { Institution } from '@/types/institution'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, CheckCircle2, Settings2, Trash2 } from 'lucide-react'

interface InstitutionCardProps {
  institution: Institution
  onDelete: (id: string) => void
  onApprove?: (id: string) => void
}

export function InstitutionCard({ institution, onDelete, onApprove }: InstitutionCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    trial: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              {institution.logo_url ? (
                <img src={institution.logo_url} alt={institution.name} className="h-full w-full rounded-lg object-cover" />
              ) : (
                <Building2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl">{institution.name}</CardTitle>
              <CardDescription className="capitalize">{institution.type.replace('_', ' ')}</CardDescription>
            </div>
          </div>
          <Badge className={statusColors[institution.subscription_status]}>
            {institution.subscription_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invite Code:</span>
            <span className="font-mono font-bold">
              {institution.subscription_status === 'pending'
                ? 'Hidden pending approval'
                : institution.invite_code || 'Not generated'}
            </span>
          </div>
          {institution.contact_email && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Contact:</span>
              <span className="truncate text-right">{institution.contact_email}</span>
            </div>
          )}
          {institution.member_count_estimate ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Members:</span>
              <span>{institution.member_count_estimate}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submitted:</span>
            <span>{new Date(institution.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Global Posting:</span>
            <span>{institution.allow_global_posting ? '✅' : '❌'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Global Resources:</span>
            <span>{institution.allow_global_resources ? '✅' : '❌'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {institution.subscription_status === 'pending' && onApprove && (
          <Button variant="outline" size="sm" onClick={() => onApprove(institution.id)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1">
          <Settings2 className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(institution.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
