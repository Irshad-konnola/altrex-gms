"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  CreditCard, 
  MessageCircle, 
  Settings,
  Dumbbell,
  BarChart3,
  MonitorSmartphone,
  LogOut
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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

export function Sidebar({ userRole = "owner" }: { userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Filter routes based on user role
  const visibleRoutes = routes.filter(
    (route) => route.role === "both" || route.role === userRole
  )

  return (
    <div className="hidden lg:flex w-[240px] flex-col bg-dark-950 border-r border-dark-800 h-screen fixed top-0 left-0">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-dark-800">
        <Dumbbell className="w-5 h-5 text-gold-500 mr-3" />
        <span className="text-lg font-bold text-white tracking-tight">Altrex GMS</span>
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
                  : "text-dark-300 hover:text-white hover:bg-dark-900"
              )}
            >
              <route.icon className={cn("w-5 h-5", isActive ? "text-gold-500" : "text-dark-400")} />
              {route.label}
            </Link>
          )
        })}
      </div>

      {/* Logout Button Footer */}
      <div className="p-4 border-t border-dark-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-900 transition-colors"
        >
          <LogOut className="w-5 h-5 text-dark-400" />
          Sign Out
        </button>
      </div>
    </div>
  )
}