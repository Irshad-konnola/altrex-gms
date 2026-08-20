"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Menu, LayoutDashboard, Users, ClipboardCheck, CreditCard, 
  MessageCircle,  Dumbbell, BarChart3, LogOut 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

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

export function MobileMenu({ userRole = "owner" }: { userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const visibleRoutes = routes.filter(
    (route) => route.role === "both" || route.role === userRole
  )

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* FIXED: Removed asChild and the inner Button component. 
          Applied the ghost button styles directly to the SheetTrigger */}
      <SheetTrigger className="lg:hidden p-2 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <Menu className="w-6 h-6" />
      </SheetTrigger>
      
      <SheetContent side="left" className="w-70 bg-background border-r border-border p-0 flex flex-col">
        <SheetHeader className="h-16 border-b border-border px-6 flex flex-row items-center justify-start space-y-0">
          <Dumbbell className="w-5 h-5 text-gold-500 mr-2" />
          <SheetTitle className="text-lg font-bold text-foreground tracking-tight">Altrex GMS</SheetTitle>
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
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                )}
              >
                <route.icon className={cn("w-5 h-5", isActive ? "text-gold-500" : "text-muted-foreground")} />
                {route.label}
              </Link>
            )
          })}
        </div>
        
        <div className="p-4 border-t border-border">
          <Dialog>
            <DialogTrigger className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors">
              <LogOut className="w-5 h-5" />
              Sign Out
            </DialogTrigger>
            <DialogContent className="bg-card border border-border/50 text-foreground sm:max-w-md rounded-2xl w-[90vw] shadow-2xl dark:shadow-[0_8px_30px_rgba(234,179,8,0.1)]">
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
      </SheetContent>
    </Sheet>
  )
}