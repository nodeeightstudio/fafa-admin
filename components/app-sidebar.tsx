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
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Sample data for admin dashboard
const data = {
  user: {
    name: "Admin User",
    email: "admin@fafa.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
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
        {
          title: "All Counsellors",
          url: "/dashboard/counsellors",
        },
        {
          title: "Add New",
          url: "/dashboard/counsellors/new",
        },
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
      title: "Resources",
      url: "/dashboard/resources",
      icon: BookOpen,
      items: [
        {
          title: "All Resources",
          url: "/dashboard/resources",
        },
        {
          title: "Add New",
          url: "/dashboard/resources/new",
        },
      ],
    },
    {
      title: "Moderation",
      url: "/dashboard/reports",
      icon: Shield,
      items: [
        {
          title: "Reports",
          url: "/dashboard/reports",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
            <img src="/logo.png" alt="FAFA Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-primary tracking-tight">FAFA Admin</span>
            <span className="truncate text-xs">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}