"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, ClipboardCheck, CreditCard } from "lucide-react"

const mobileRoutes = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/members", label: "Members", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-dark-950 border-t border-dark-800 z-50 flex items-center justify-around px-2 pb-safe">
      {mobileRoutes.map((route) => {
        const isActive = pathname.startsWith(route.href)
        
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-gold-500" : "text-dark-400 hover:text-dark-200"
            )}
          >
            <route.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]")} />
            <span className="text-[10px] font-medium">{route.label}</span>
          </Link>
        )
      })}
    </div>
  )
}