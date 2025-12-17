'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isUserAdmin } from '@/lib/supabase'
import { Counsellor } from '@/types/counsellor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CounsellorCard } from '@/components/counsellors/counsellor-card'
import { CounsellorForm } from '@/components/counsellors/counsellor-form'
import { getCounsellors, createCounsellor, deleteCounsellor } from '@/lib/actions/counsellors'
import { Search, Plus } from 'lucide-react'

export default function CounsellorsPage() {
  const [counsellors, setCounsellors] = useState<Counsellor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [onlineFilter, setOnlineFilter] = useState(false)
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
        online: onlineFilter
      })
      setCounsellors(data)
    } catch (error) {
      console.error('Error fetching counsellors:', error)
    }
    setLoading(false)
  }

  const handleCreateCounsellor = async (formData: any) => {
    setFormLoading(true)
    try {
      await createCounsellor(formData)
      setIsModalOpen(false)
      await fetchCounsellors()
    } catch (error: any) {
      alert(error.message || 'Failed to create counsellor')
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
    } catch (error: any) {
      alert(error.message || 'Failed to delete counsellor')
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
                <BreadcrumbPage>Counsellors</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Counsellors</h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Counsellor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Counsellor</DialogTitle>
                <DialogDescription>
                  Create a new counsellor profile
                </DialogDescription>
              </DialogHeader>
              <CounsellorForm
                onSubmit={handleCreateCounsellor}
                onCancel={() => setIsModalOpen(false)}
                isLoading={formLoading}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter counsellors</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Counsellors Grid */}
        {loading ? (
          <div className="text-center py-8">Loading counsellors...</div>
        ) : counsellors.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-muted-foreground">No counsellors found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or add a new counsellor
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {counsellors.map((counsellor) => (
              <CounsellorCard
                key={counsellor.id}
                counsellor={counsellor}
                onDelete={handleDeleteCounsellor}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}