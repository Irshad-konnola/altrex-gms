import { useQuery } from '@tanstack/react-query'
import { getAllPayments } from '@/app/(dashboard)/payments/actions'

export type PaymentWithDetails = {
  id: string
  member_id: string
  amount: number
  method: 'cash' | 'upi' | 'card' | 'razorpay'
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  payment_date: string
  created_at: string
  description:string
  members?: { full_name: string; photo_url: string | null }
  memberships?: { 
    membership_plans?: { name: string } 
  }
}

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const data = await getAllPayments()
      return data as unknown as PaymentWithDetails[]
    }
  })
}