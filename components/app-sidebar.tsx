"use client"

import * as React from "react"
import {
  Users,
  BookOpen,
  Shield,
  LayoutDashboard,
  Settings,
  Calendar,
  Building2,
  Megaphone,
} from "lucide-react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getAdminRecord, AdminUser, supabase } from "@/lib/supabase"

interface SidebarUser {
  name: string
  email: string
  avatar: string
}

const superAdminNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Counsellors",
    url: "/dashboard/counsellors",
    icon: Users,
    items: [
      { title: "All Counsellors", url: "/dashboard/counsellors" },
      { title: "Add New", url: "/dashboard/counsellors/new" },
    ],
  },
  {
    title: "Institutions",
    url: "/dashboard/institutions",
    icon: Building2,
  },
  {
    title: "Bookings",
    url: "/dashboard/bookings",
    icon: Calendar,
  },
  {
    title: "Broadcasts",
    url: "/dashboard/broadcasts",
    icon: Megaphone,
  },
  {
    title: "Resources",
    url: "/dashboard/resources",
    icon: BookOpen,
    items: [
      { title: "All Resources", url: "/dashboard/resources" },
      { title: "Add New", url: "/dashboard/resources/new" },
    ],
  },
  {
    title: "Moderation",
    url: "/dashboard/reports",
    icon: Shield,
    items: [{ title: "Reports", url: "/dashboard/reports" }],
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

const institutionAdminNav = [
  {
    title: "Institution",
    url: "/dashboard/institution",
    icon: Building2,
    isActive: true,
  },
  {
    title: "Resources",
    url: "/dashboard/resources",
    icon: BookOpen,
  },
  {
    title: "Counsellors",
    url: "/dashboard/counsellors",
    icon: Users,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [sidebarUser, setSidebarUser] = useState<SidebarUser>({
    name: "Loading...",
    email: "",
    avatar: "",
  })
  const pathname = usePathname()

  useEffect(() => {
    async function loadUser() {
      const [
        adminRecord,
        {
          data: { user },
        },
      ] = await Promise.all([getAdminRecord(), supabase.auth.getUser()])

      setAdmin(adminRecord)

      const metadata = user?.user_metadata || {}
      const email = user?.email || adminRecord?.email || ""
      const displayName =
        metadata.full_name ||
        metadata.name ||
        adminRecord?.email?.split("@")[0] ||
        email.split("@")[0] ||
        "Admin"

      setSidebarUser({
        name: displayName,
        email,
        avatar: metadata.avatar_url || metadata.picture || "",
      })
    }

    loadUser()
  }, [])

  const navItems =
    admin?.role === "institution_admin" ? institutionAdminNav : superAdminNav

  const itemsWithActive = navItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + "/"),
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
            <img src="/logo.png" alt="FAFA Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-primary tracking-tight">FAFA Admin</span>
            <span className="truncate text-xs">
              {admin?.role === "institution_admin" ? "Institution" : "Dashboard"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={itemsWithActive} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: sidebarUser.name,
            email: sidebarUser.email,
            avatar: sidebarUser.avatar,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
