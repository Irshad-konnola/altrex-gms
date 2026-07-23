// src/app/(dashboard)/payments/page.tsx
import { PageHeader } from '@/components/layout/PageHeader'
import { PaymentsClient } from '@/components/payments/PaymentsClient'

export const metadata = {
  title: 'Payments & Billing | Altrex GMS',
  description: 'Manage gym revenue, pending dues, and transactions.',
}

export default function PaymentsPage() {
  return (
    <div className="flex-1 space-y-4">
      <PageHeader 
        title="Payments & billing" 
        // FIX: Changed from an array of objects to a simple string
        breadcrumb="Home / Payments" 
      />
      <PaymentsClient />
    </div>
  )
}