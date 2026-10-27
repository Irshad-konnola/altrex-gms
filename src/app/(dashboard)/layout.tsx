import { DashboardShell } from "@/components/layout/DashboardShell"
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
    <DashboardShell userRole={userRole}>
      {children}
    </DashboardShell>
  )
}
