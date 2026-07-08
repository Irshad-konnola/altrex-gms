import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { MobileNav } from "@/components/layout/MobileNav"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const userRole = user.user_metadata?.role || "front_desk"

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50 flex flex-col md:flex-row">
      <Sidebar userRole={userRole} />
      
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Pass the userRole into the TopBar! */}
        <TopBar userRole={userRole} />
        
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}