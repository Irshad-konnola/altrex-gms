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
  LogOut
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
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
  { href: "/plans", label: "Plans", icon: Dumbbell, role: "owner" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, role: "owner" },
  { href: "/pt", label: "Personal Training", icon: Dumbbell, role: "both" },
  { href: "/reports", label: "Reports", icon: BarChart3, role: "owner" },
  // { href: "/device", label: "eSSL Device", icon: MonitorSmartphone, role: "owner" },
  // { href: "/settings", label: "Settings", icon: Settings, role: "owner" },
]

export function Sidebar({ userRole = "owner" }: { userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
    <div className="hidden lg:flex w-[240px] flex-col bg-background border-r border-border h-screen fixed top-0 left-0">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Dumbbell className="w-5 h-5 text-gold-500 mr-3" />
        <span className="text-lg font-bold text-foreground tracking-tight">Altrex GMS</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {visibleRoutes.map((route) => {
          const isActive = pathname.startsWith(route.href)
          
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-gold-500/10 text-gold-500 border-l-2 border-gold-500 rounded-l-none" 
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              )}
            >
              <route.icon className={cn("w-5 h-5", isActive ? "text-gold-500" : "text-muted-foreground")} />
              {route.label}
            </Link>
          )
        })}
      </div>

      {/* Logout Button Footer */}
      <div className="p-4 border-t border-border">
        <Dialog>
          <DialogTrigger className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors">
            <LogOut className="w-5 h-5 text-muted-foreground" />
            Sign Out
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
    </div>
  )
}