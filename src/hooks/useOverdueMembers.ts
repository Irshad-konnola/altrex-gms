// src/hooks/useOverdueMembers.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useOverdueMembers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['overdue-members'],
    queryFn: async () => {
      // Fetch members who are expired, along with their last membership to know the plan price
      const { data, error } = await supabase
        .from('members')
        .select(`
          id, 
          full_name, 
          phone, 
          status,
          current_memberships(
            end_date, 
            membership_plans(id, name, price)
          )
        `)
        .eq('status', 'expired')
        .order('updated_at', { ascending: false })
        .limit(10) // Keep the panel clean with top 10

      if (error) throw error
      return data
    }
  })
}