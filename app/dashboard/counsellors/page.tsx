'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isUserAdmin } from '@/lib/supabase'
import { Counsellor, CounsellorFormData } from '@/types/counsellor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CounsellorForm } from '@/components/counsellors/counsellor-form'
import { getCounsellors, createCounsellor, deleteCounsellor } from '@/lib/actions/counsellors'
import { getInstitutions } from '@/lib/actions/institutions'
import { Institution } from '@/types/institution'
import { Search, Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { StatusBadge } from '@/components/data-table/status-badge'
import { RowActions } from '@/components/data-table/row-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function CounsellorsPage() {
  const [counsellors, setCounsellors] = useState<Counsellor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [onlineFilter, setOnlineFilter] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [institutionAdminInstitutionId, setInstitutionAdminInstitutionId] = useState<
    string | undefined
  >()
  const router = useRouter()

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

      const { data: adminRecord } = await supabase
        .from('admins')
        .select('role, institution_id')
        .eq('id', user.id)
        .single()

      if (adminRecord?.role === 'institution_admin' && adminRecord.institution_id) {
        setInstitutionAdminInstitutionId(adminRecord.institution_id)
      }

      fetchInstitutions()
      fetchCounsellors()
    }
    checkAuth()
  }, [router, searchQuery, statusFilter, onlineFilter])

  const fetchCounsellors = async () => {
    setLoading(true)
    try {
      const data = await getCounsellors({
        status: statusFilter,
        search: searchQuery,
        online: onlineFilter,
      })
      setCounsellors(data)
    } catch (error) {
      console.error('Error fetching counsellors:', error)
    }
    setLoading(false)
  }

  const fetchInstitutions = async () => {
    try {
      const data = await getInstitutions()
      setInstitutions(data)
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  const handleCreateCounsellor = async (formData: CounsellorFormData) => {
    setFormLoading(true)
    try {
      await createCounsellor(formData)
      setIsModalOpen(false)
      await fetchCounsellors()
      toast.success('Counsellor created')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create counsellor')
    }
    setFormLoading(false)
  }

  const handleDeleteCounsellor = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this counsellor?')) {
      return
    }

    try {
      await deleteCounsellor(id)
      await fetchCounsellors()
      toast.success('Counsellor deactivated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete counsellor')
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'counsellor',
        header: 'Counsellor',
        cell: (counsellor: Counsellor) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Avatar className="h-9 w-9">
              <AvatarImage src={counsellor.avatar_url || undefined} alt={counsellor.name} />
              <AvatarFallback>{getInitials(counsellor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium leading-none">{counsellor.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {counsellor.email || 'No email'}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'specialties',
        header: 'Specialties',
        cell: (counsellor: Counsellor) => (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {counsellor.specialties.slice(0, 2).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {counsellor.specialties.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{counsellor.specialties.length - 2}
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'stats',
        header: 'Performance',
        cell: (counsellor: Counsellor) => (
          <div className="text-sm">
            <p>{counsellor.average_rating.toFixed(1)} rating</p>
            <p className="text-xs text-muted-foreground">
              {counsellor.total_sessions} sessions
            </p>
          </div>
        ),
      },
      {
        id: 'availability',
        header: 'Availability',
        cell: (counsellor: Counsellor) => (
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                counsellor.is_online ? 'bg-green-500' : 'bg-muted-foreground/40'
              }`}
            />
            {counsellor.is_online ? 'Online' : 'Offline'}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (counsellor: Counsellor) => <StatusBadge status={counsellor.status} />,
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
                <BreadcrumbPage>Counsellors</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Counsellors</h1>
            <p className="text-muted-foreground">Manage counsellor profiles and availability</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Counsellor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Counsellor</DialogTitle>
                <DialogDescription>Create a new counsellor profile</DialogDescription>
              </DialogHeader>
              <CounsellorForm
                onSubmit={handleCreateCounsellor}
                onCancel={() => setIsModalOpen(false)}
                isLoading={formLoading}
                institutions={institutions}
                institutionAdminInstitutionId={institutionAdminInstitutionId}
              />
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          title="Counsellor Directory"
          description="Search, filter, and manage support providers."
          loading={loading}
          data={counsellors}
          columns={columns}
          getRowId={(row) => row.id}
          emptyTitle="No counsellors found"
          emptyDescription="Try adjusting your filters or add a new counsellor."
          emptyAction={
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              Add counsellor
            </Button>
          }
          toolbar={
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={onlineFilter ? 'default' : 'outline'}
                onClick={() => setOnlineFilter(!onlineFilter)}
              >
                {onlineFilter ? 'Online Only' : 'All Availability'}
              </Button>
            </div>
          }
          actions={(counsellor) => (
            <RowActions
              actions={[
                {
                  label: 'View profile',
                  onClick: () => router.push(`/dashboard/counsellors/${counsellor.id}`),
                },
                {
                  label: 'Edit',
                  onClick: () => router.push(`/dashboard/counsellors/${counsellor.id}`),
                },
                {
                  label: 'Deactivate',
                  destructive: true,
                  separator: true,
                  onClick: () => handleDeleteCounsellor(counsellor.id),
                },
              ]}
            />
          )}
        />
      </div>
    </>
  )
}
