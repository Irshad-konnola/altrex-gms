// src/hooks/usePayments.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type PaymentWithDetails = {
  id: string
  member_id: string
  amount: number
  method: 'cash' | 'upi' | 'card' | 'razorpay'
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  payment_date: string
  created_at: string
  members?: { full_name: string; photo_url: string | null }
  memberships?: { 
    membership_plans?: { name: string } 
  }
}

export function usePayments() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id, member_id, amount, method, status, payment_date, created_at,
          members:member_id (full_name, photo_url),
          memberships:membership_id (
            membership_plans:plan_id (name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase fetch error:', error)
        throw new Error('Failed to fetch payments')
      }

      // 'unknown' is the TypeScript-safe way to override PostgREST types without triggering ESLint 'any' errors
      return data as unknown as PaymentWithDetails[]
    }
  })
}