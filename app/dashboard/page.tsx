'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isUserAdmin } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarTrigger,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import { OverviewSnapshot } from '@/components/overview-snapshot'
import { DashboardTracker } from '@/components/dashboard-tracker'
import { StatsCards } from '@/components/stats-cards'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
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

      setUser(user)
      setIsAdmin(true)
    }
    checkUser()
  }, [router])

  if (!user || !isAdmin) {
    return <div>Loading...</div>
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
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <OverviewSnapshot />
        <DashboardTracker />

        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Counsellors</CardTitle>
              <CardDescription>Manage counsellor profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/counsellors">
                <Button className="w-full">View Counsellors</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Manage educational resources</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/resources">
                <Button className="w-full">View Resources</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation</CardTitle>
              <CardDescription>Review reported content</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/reports">
                <Button className="w-full">View Reports</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Institutions</CardTitle>
              <CardDescription>Manage B2B partners</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/institutions">
                <Button className="w-full">View Institutions</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}