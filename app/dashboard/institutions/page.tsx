'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isUserAdmin, isInstitutionAdmin } from '@/lib/supabase'
import { Institution } from '@/types/institution'
import { Button } from '@/components/ui/button'
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
import { Plus, Building2 } from 'lucide-react'
import { InstitutionForm } from '@/components/institutions/institution-form'
import {
  approveInstitution,
  createInstitution,
  deleteInstitution,
  getInstitutions,
} from '@/lib/actions/institutions'
import { DataTable } from '@/components/data-table/data-table'
import { StatusBadge } from '@/components/data-table/status-badge'
import { RowActions } from '@/components/data-table/row-actions'
import { toast } from 'sonner'

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const router = useRouter()

  const fetchInstitutions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInstitutions()
      setInstitutions(data)
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
    setLoading(false)
  }, [])

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

      const instAdmin = await isInstitutionAdmin()
      if (instAdmin) {
        router.replace('/dashboard/institution')
        return
      }

      fetchInstitutions()
    }
    checkAuth()
  }, [router, fetchInstitutions])

  const handleCreateInstitution = async (formData: Omit<Institution, 'id' | 'created_at' | 'updated_at'>) => {
    setFormLoading(true)
    try {
      await createInstitution(formData)
      setIsModalOpen(false)
      await fetchInstitutions()
      toast.success('Institution created')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create institution')
    }
    setFormLoading(false)
  }

  const handleDeleteInstitution = async (id: string) => {
    if (!confirm('Are you sure you want to delete this institution? This action cannot be undone.')) {
      return
    }

    try {
      await deleteInstitution(id)
      await fetchInstitutions()
      toast.success('Institution deleted')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete institution')
    }
  }

  const handleApproveInstitution = async (id: string) => {
    if (!confirm('Approve this institution and generate its join code?')) {
      return
    }

    try {
      await approveInstitution(id)
      await fetchInstitutions()
      toast.success('Institution approved')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve institution')
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'institution',
        header: 'Institution',
        cell: (institution: Institution) => (
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              {institution.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt={institution.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-4 w-4 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium leading-none">{institution.name}</p>
              <p className="mt-1 capitalize text-xs text-muted-foreground">
                {institution.type.replace('_', ' ')}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (institution: Institution) => (
          <StatusBadge status={institution.subscription_status} />
        ),
      },
      {
        id: 'contact',
        header: 'Contact',
        cell: (institution: Institution) => (
          <div className="text-sm">
            <p>{institution.contact_name || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {institution.contact_email || 'No email'}
            </p>
          </div>
        ),
      },
      {
        id: 'joinCode',
        header: 'Join Code',
        cell: (institution: Institution) => (
          <span className="font-mono text-sm">
            {institution.subscription_status === 'pending'
              ? 'Hidden'
              : institution.invite_code || 'Not generated'}
          </span>
        ),
      },
      {
        id: 'submitted',
        header: 'Submitted',
        cell: (institution: Institution) => (
          <span className="text-sm text-muted-foreground">
            {new Date(institution.created_at).toLocaleDateString()}
          </span>
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
                <BreadcrumbPage>Institutions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Institutions</h1>
            <p className="text-muted-foreground">Manage your B2B institutional partners</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Institution
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Institution</DialogTitle>
                <DialogDescription>
                  Create a new private community space for an organization.
                </DialogDescription>
              </DialogHeader>
              <InstitutionForm
                onSubmit={handleCreateInstitution}
                onCancel={() => setIsModalOpen(false)}
                isLoading={formLoading}
              />
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          title="Institution Directory"
          description="Review onboarding requests and manage partner workspaces."
          loading={loading}
          data={institutions}
          columns={columns}
          getRowId={(row) => row.id}
          emptyTitle="No institutions found"
          emptyDescription="Create your first institution to get started."
          emptyAction={
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              Add institution
            </Button>
          }
          actions={(institution) => (
            <RowActions
              actions={[
                ...(institution.subscription_status === 'pending'
                  ? [
                      {
                        label: 'Approve',
                        onClick: () => handleApproveInstitution(institution.id),
                      },
                    ]
                  : []),
                {
                  label: 'Delete',
                  destructive: true,
                  separator: institution.subscription_status === 'pending',
                  onClick: () => handleDeleteInstitution(institution.id),
                },
              ]}
            />
          )}
        />
      </div>
    </>
  )
}
