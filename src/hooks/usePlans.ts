// src/hooks/usePlans.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface MembershipPlan {
  id: string
  name: string
  duration_days: number
  price: number
  description: string | null
  features: string[] | null
  is_active: boolean
  sort_order: number
}

export function usePlans() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
.order('price', { ascending: true })
      if (error) {
        throw new Error('Failed to fetch membership plans')
      }

      return data as MembershipPlan[]
    }
  })
}