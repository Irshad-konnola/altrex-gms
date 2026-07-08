"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Menu, LayoutDashboard, Users, ClipboardCheck, CreditCard, 
  MessageCircle, Settings, Dumbbell, BarChart3, MonitorSmartphone, LogOut 
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, role: "owner" },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck, role: "both" },
  { href: "/members", label: "Members", icon: Users, role: "both" },
  { href: "/payments", label: "Payments", icon: CreditCard, role: "both" },
  { href: "/plans", label: "Plans", icon: Dumbbell, role: "owner" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, role: "owner" },
  { href: "/pt", label: "Personal Training", icon: Dumbbell, role: "both" },
  { href: "/reports", label: "Reports", icon: BarChart3, role: "owner" },
  { href: "/device", label: "eSSL Device", icon: MonitorSmartphone, role: "owner" },
  { href: "/settings", label: "Settings", icon: Settings, role: "owner" },
]

export function MobileMenu({ userRole = "front_desk" }: { userRole: string }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Force a hard reload to clear server components
    window.location.href = "/login"
  }

  const visibleRoutes = routes.filter(
    (route) => route.role === "both" || route.role === userRole
  )

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* FIXED: Removed asChild and the inner Button component. 
          Applied the ghost button styles directly to the SheetTrigger */}
      <SheetTrigger className="lg:hidden p-2 flex items-center justify-center rounded-md text-dark-300 hover:text-white hover:bg-dark-800 transition-colors">
        <Menu className="w-6 h-6" />
      </SheetTrigger>
      
      <SheetContent side="left" className="w-70 bg-dark-950 border-r border-dark-800 p-0 flex flex-col">
        <SheetHeader className="h-16 border-b border-dark-800 px-6 flex flex-row items-center justify-start space-y-0">
          <Dumbbell className="w-5 h-5 text-gold-500 mr-2" />
          <SheetTitle className="text-lg font-bold text-white tracking-tight">Altrex GMS</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleRoutes.map((route) => {
            const isActive = pathname.startsWith(route.href)
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setIsOpen(false)} // Close menu on click
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-gold-500/10 text-gold-500 border-l-2 border-gold-500 rounded-l-none" 
                    : "text-dark-300 hover:text-white hover:bg-dark-900"
                )}
              >
                <route.icon className={cn("w-5 h-5", isActive ? "text-gold-500" : "text-dark-400")} />
                {route.label}
              </Link>
            )
          })}
        </div>
        
        <div className="p-4 border-t border-dark-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-900 transition-colors"
          >
            <LogOut className="w-5 h-5 text-dark-400" />
            Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}