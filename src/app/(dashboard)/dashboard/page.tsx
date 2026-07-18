// src/app/(dashboard)/dashboard/page.tsx
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export const metadata = {
  title: 'Dashboard | Altrex GMS',
  description: 'Gym Management System Dashboard',
}

export default async function DashboardPage() {
  // Because this is a Server Component, you can do server-side 
  // auth checks or fetch initial data here later if needed.
  
  return (
    <div className="flex flex-col min-h-screen bg-dark-900 text-white p-4 md:p-6">
      {/* We pass the heavy lifting to our Client Component */}
      <DashboardClient />
    </div>
  )
}