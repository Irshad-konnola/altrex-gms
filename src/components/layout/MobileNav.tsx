// src/components/layout/MobileNav.tsx
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
    // Replaced the flat bottom bar with a floating, blurred glass dock
    <div className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-dark-900/85 backdrop-blur-xl border border-dark-700/50 rounded-2xl z-50 flex items-center justify-around px-2 shadow-2xl shadow-black/80 pb-safe-auto">
      {mobileRoutes.map((route) => {
        const isActive = pathname.startsWith(route.href)
        
        return (
          <Link
            key={route.href}
            href={route.href}
            className="relative flex flex-col items-center justify-center w-full h-full group"
          >
            {/* Active Pill Background */}
            <div className={cn(
              "absolute inset-y-1.5 inset-x-2 rounded-xl transition-all duration-300",
              isActive ? "bg-gold-500/10" : "opacity-0 group-hover:bg-dark-800/50"
            )} />

            <div className="relative flex flex-col items-center space-y-1 z-10">
              <route.icon 
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive 
                    ? "text-gold-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] -translate-y-0.5" 
                    : "text-dark-400 group-hover:text-dark-200"
                )} 
              />
              <span 
                className={cn(
                  "text-[10px] font-semibold tracking-wide transition-all duration-300",
                  isActive ? "text-gold-500" : "text-dark-500 group-hover:text-dark-300"
                )}
              >
                {route.label}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}