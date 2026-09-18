import { useQuery } from '@tanstack/react-query'
import { getMembers } from '@/app/(dashboard)/members/actions'

export function useOverdueMembers() {
  return useQuery({
    queryKey: ['overdue-members'],
    queryFn: async () => {
      const members = await getMembers()
      
      // Filter out members that don't owe money or are totally missing data
      const dueMembers = members.filter(m => m.due_amount > 0)
      
      // Sort by due amount (highest first) and take top 10
      return dueMembers.sort((a, b) => b.due_amount - a.due_amount).slice(0, 10)
    }
  })
}
