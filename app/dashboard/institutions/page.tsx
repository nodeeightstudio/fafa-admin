'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isUserAdmin, isInstitutionAdmin } from '@/lib/supabase'
import { Institution } from '@/types/institution'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus } from 'lucide-react'
import { InstitutionCard } from '@/components/institutions/institution-card'
import { InstitutionForm } from '@/components/institutions/institution-form'
import {
  approveInstitution,
  createInstitution,
  deleteInstitution,
  getInstitutions,
} from '@/lib/actions/institutions'

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
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
        alert('Access denied. Admin privileges required.')
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
  }, [router])

  const fetchInstitutions = async () => {
    setLoading(true)
    try {
      const data = await getInstitutions()
      setInstitutions(data)
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
    setLoading(false)
  }

  const handleCreateInstitution = async (formData: any) => {
    setFormLoading(true)
    try {
      await createInstitution(formData)
      setIsModalOpen(false)
      await fetchInstitutions()
    } catch (error: any) {
      alert(error.message || 'Failed to create institution')
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
    } catch (error: any) {
      alert(error.message || 'Failed to delete institution')
    }
  }

  const handleApproveInstitution = async (id: string) => {
    if (!confirm('Approve this institution and generate its join code?')) {
      return
    }

    try {
      await approveInstitution(id)
      await fetchInstitutions()
    } catch (error: any) {
      alert(error.message || 'Failed to approve institution')
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
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
                <Plus className="h-4 w-4 mr-2" />
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

        {loading ? (
          <div className="text-center py-8">Loading institutions...</div>
        ) : institutions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No institutions found</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                Add your first institution
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <InstitutionCard
                key={institution.id}
                institution={institution}
                onDelete={handleDeleteInstitution}
                onApprove={handleApproveInstitution}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
