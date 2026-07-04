import { Sidebar } from "@/components/layout/Sidebar"
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
    <div className="min-h-screen bg-dark-900 text-dark-50">
      {/* Desktop Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="lg:pl-[240px] flex flex-col min-h-screen">
        
        {/* TopBar Placeholder (We will build this next) */}
        <header className="h-16 border-b border-dark-800 bg-dark-950/50 backdrop-blur-md flex items-center px-6 sticky top-0 z-40">
           <span className="text-dark-300 text-sm font-medium">TopBar coming soon...</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}