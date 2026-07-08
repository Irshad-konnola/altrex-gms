"use client"

import { Search, Bell, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MobileMenu } from "@/components/layout/MobileMenu"

// We pass userRole in so the MobileMenu knows which links to hide/show
export function TopBar({ userRole }: { userRole: string }) {
  return (
    <header className="h-16 border-b border-dark-800 bg-dark-950/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      
      {/* Mobile Menu Trigger & Logo */}
      <div className="lg:hidden flex items-center gap-2">
        <MobileMenu userRole={userRole} />
        <span className="text-lg font-bold text-white tracking-tight">Altrex</span>
      </div>

      {/* Global Search (Hidden on very small screens) */}
      <div className="hidden sm:flex relative w-64 md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
        <Input 
          type="text" 
          placeholder="Search members by name or phone..." 
          className="pl-10 h-10 bg-dark-900 border-dark-800 text-white placeholder:text-dark-400 focus-visible:ring-gold-500/50 rounded-xl transition-all"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-dark-300 hover:text-gold-500 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
        </button>
        
        <div className="h-8 w-8 rounded-full bg-linear-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)]">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  )
}