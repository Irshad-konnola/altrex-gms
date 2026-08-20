// src/components/layout/TopBar.tsx
"use client"

import { User } from "lucide-react"
import { MobileMenu } from "@/components/layout/MobileMenu"
import { ThemeToggle } from "./ThemeToggle"

export function TopBar({ userRole }: { userRole: string }) {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      
      {/* Mobile Menu Trigger & Logo */}
      <div className="lg:hidden flex items-center gap-3">
        <MobileMenu userRole={userRole} />
        <span className="text-lg font-bold text-foreground tracking-tight">Altrex</span>
      </div>

      {/* Empty spacer to push right-side content to the edge on desktop */}
      <div className="hidden lg:block flex-1" />

      {/* Right Side Actions */}
      <div className="flex items-center gap-4 ml-auto">
        
        <ThemeToggle />
        
        {/* Role Indicator (Hidden on tiny screens) */}
        <div className="hidden sm:flex flex-col items-end mr-1">
          <span className="text-sm font-bold text-foreground capitalize">
            {userRole.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-green-400 uppercase tracking-wider font-semibold">
            Active Session
          </span>
        </div>
        
        {/* Profile Button */}
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)]">
          <User className="w-5 h-5" />
        </div>
      </div>
      
    </header>
  )
}