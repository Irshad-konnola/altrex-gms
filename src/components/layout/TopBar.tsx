// src/components/layout/TopBar.tsx
"use client"

import { User, LogOut } from "lucide-react"
import { MobileMenu } from "@/components/layout/MobileMenu"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function TopBar({ userRole }: { userRole: string }) {
  const supabase = createClient()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Logged out successfully")
      // Force a hard reload to clear all states and middleware
      window.location.assign("/login")
    } catch  {
      toast.error("Error logging out")
    }
  }

  return (
    <header className="h-16 border-b border-dark-800 bg-dark-950/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      
      {/* Mobile Menu Trigger & Logo */}
      <div className="lg:hidden flex items-center gap-3">
        <MobileMenu userRole={userRole} />
        <span className="text-lg font-bold text-white tracking-tight">Altrex</span>
      </div>

      {/* Empty spacer to push right-side content to the edge on desktop */}
      <div className="hidden lg:block flex-1" />

      {/* Right Side Actions - Now Fully Functional */}
      <div className="flex items-center gap-4 ml-auto">
        
        {/* Role Indicator (Hidden on tiny screens) */}
        <div className="hidden sm:flex flex-col items-end mr-1">
          <span className="text-sm font-bold text-white capitalize">
            {userRole.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-green-400 uppercase tracking-wider font-semibold">
            Active Session
          </span>
        </div>
        
        {/* Functional Logout / Profile Button */}
        <button 
          onClick={handleSignOut}
          title="Sign Out"
          className="group flex items-center gap-3 bg-dark-900 hover:bg-dark-800 border border-dark-800 hover:border-dark-700 rounded-full pl-1.5 pr-4 py-1.5 transition-all duration-300"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)] group-hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-shadow">
            <User className="w-4 h-4" />
          </div>
          <LogOut className="w-4 h-4 text-dark-400 group-hover:text-red-400 transition-colors" />
        </button>
      </div>
      
    </header>
  )
}