"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  CreditCard, 
  MessageCircle, 
  Dumbbell,
  BarChart3,
  LogOut,
  PanelLeftClose,
  PanelLeft
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useSidebar } from "./DashboardShell"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, role: "owner" },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck, role: "both" },
  { href: "/members", label: "Members", icon: Users, role: "both" },
  { href: "/payments", label: "Payments", icon: CreditCard, role: "both" },
  { href: "/plans", label: "Plans", icon: Dumbbell, role: "both" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, role: "owner" },
  { href: "/pt", label: "Personal Training", icon: Dumbbell, role: "both" },
  { href: "/reports", label: "Reports", icon: BarChart3, role: "owner" },
]

export function Sidebar({ userRole = "owner" }: { userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { isCollapsed, toggleSidebar } = useSidebar()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Filter routes based on user role
  const visibleRoutes = routes.filter(
    (route) => route.role === "both" || route.role === userRole
  )

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col bg-background border-r border-border h-screen fixed top-0 left-0 z-40 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      
      {/* Brand Header */}
      <div className={cn(
        "h-16 flex items-center border-b border-border transition-all duration-300",
        isCollapsed ? "justify-center px-2" : "justify-between px-5"
      )}>
        <Link href={userRole === "owner" ? "/dashboard" : "/members"} className="flex items-center min-w-0 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform" 
          />
          {!isCollapsed && (
            <span className="text-lg font-bold text-foreground tracking-tight ml-3 truncate animate-in fade-in duration-200">
              Altrex GMS
            </span>
          )}
        </Link>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-gold-500 hover:bg-card p-1.5 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-5 px-2.5 space-y-1.5 no-scrollbar">
        {visibleRoutes.map((route) => {
          const isActive = pathname.startsWith(route.href)
          
          return (
            <Link
              key={route.href}
              href={route.href}
              title={isCollapsed ? route.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative group",
                isCollapsed 
                  ? "justify-center h-11 w-11 mx-auto px-0" 
                  : "gap-3 px-3.5 py-2.5",
                isActive 
                  ? isCollapsed 
                    ? "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/40 shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                    : "bg-gold-500/10 text-gold-500 border-l-2 border-gold-500 rounded-l-none font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              )}
            >
              <route.icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110", 
                isActive ? "text-gold-500" : "text-muted-foreground"
              )} />
              
              {!isCollapsed && (
                <span className="truncate animate-in fade-in duration-200">
                  {route.label}
                </span>
              )}

              {/* Tooltip on Collapsed Mode */}
              {isCollapsed && (
                <span className="fixed left-[76px] px-2.5 py-1 bg-popover text-popover-foreground border border-border text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {route.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Toggle & Sign Out */}
      <div className="p-3 border-t border-border space-y-1">
        {/* Quick Expand Button when collapsed */}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center h-11 w-11 mx-auto rounded-xl text-muted-foreground hover:text-gold-500 hover:bg-card transition-colors group relative"
            title="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5" />
            <span className="fixed left-[76px] px-2.5 py-1 bg-popover text-popover-foreground border border-border text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              Expand Sidebar
            </span>
          </button>
        )}

        <Dialog>
          <DialogTrigger 
            title={isCollapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors group relative",
              isCollapsed 
                ? "justify-center h-11 w-11 mx-auto px-0" 
                : "gap-3 px-3.5 py-2.5 w-full"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-400 transition-colors" />
            {!isCollapsed && <span className="truncate">Sign Out</span>}
            
            {isCollapsed && (
              <span className="fixed left-[76px] px-2.5 py-1 bg-popover text-popover-foreground border border-border text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Sign Out
              </span>
            )}
          </DialogTrigger>
          <DialogContent className="bg-card border border-border/50 text-foreground sm:max-w-md rounded-2xl shadow-2xl dark:shadow-[0_8px_30px_rgba(234,179,8,0.1)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Confirm Sign Out</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">Are you sure you want to sign out of Altrex GMS?</p>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <DialogClose className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </DialogClose>
              <Button 
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 font-bold rounded-xl shadow-md transition-colors"
              >
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  )
}
