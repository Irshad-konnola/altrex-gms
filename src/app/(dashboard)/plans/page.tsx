// src/app/(dashboard)/plans/page.tsx
import { PlansClient } from '@/components/plans/PlansClient'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata = {
  title: 'Membership Plans | Altrex GMS',
  description: 'Manage gym membership plans and pricing',
}

export default function PlansPage() {
  return (
    <div className="flex flex-col min-h-screen bg-dark-900 text-white p-4 md:p-6 space-y-6">
      <PageHeader title="Membership Plans" breadcrumb="Plans" />
      <PlansClient />
    </div>
  )
}