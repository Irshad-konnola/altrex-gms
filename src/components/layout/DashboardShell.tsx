// src/components/layout/DashboardShell.tsx
"use client"

import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { MobileNav } from "./MobileNav"

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  setIsCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
  setIsCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export function DashboardShell({
  children,
  userRole,
}: {
  children: React.ReactNode
  userRole: string
}) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      const saved = localStorage.getItem("altrex_sidebar_collapsed")
      return saved === "true"
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem("altrex_sidebar_collapsed", String(next))
      } catch {}
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setIsCollapsed }}>
      <div className="min-h-screen bg-card text-foreground flex flex-col md:flex-row">
        <Sidebar userRole={userRole} />

        <div
          className={cn(
            "flex-1 flex flex-col min-h-screen pb-16 lg:pb-0 transition-all duration-300 ease-in-out",
            isCollapsed ? "lg:pl-[72px]" : "lg:pl-[240px]"
          )}
        >
          <TopBar userRole={userRole} />

          <main className="flex-1 p-4 lg:p-8">
            {children}
          </main>
        </div>

        <MobileNav />
      </div>
    </SidebarContext.Provider>
  )
}
