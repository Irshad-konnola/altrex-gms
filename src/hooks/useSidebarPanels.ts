// src/hooks/useSidebarPanels.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { addDays, subDays, format } from 'date-fns'

// 1. Add explicit interfaces for the return types
export interface SidebarExpiringMember {
  id: string
  full_name: string
  phone: string | null
  endDate: string
}

export interface SidebarInactiveMember {
  id: string
  full_name: string
  phone: string | null
  status: string
}

export function useSidebarPanels() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['sidebar-panels'],
    queryFn: async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const sevenDaysFromNowStr = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      const threeDaysAgoStr = format(subDays(new Date(), 3), 'yyyy-MM-dd')

      const { data: expiringData, error: expiringErr } = await supabase
        .from('memberships')
        .select('end_date, members(id, full_name, phone, status)')
        .eq('status', 'active')
        .gte('end_date', todayStr)
        .lte('end_date', sevenDaysFromNowStr)
        .order('end_date', { ascending: true })

    // 1. Fetch recent attendance
      const { data: recentAttendance } = await supabase
        .from('attendance_logs')
        .select('member_id')
        .gte('check_in_at', threeDaysAgoStr)

      // 2. FIX: Cast it so TypeScript knows member_id exists
      const typedRecentAttendance = recentAttendance as { member_id: string }[] | null

      // 3. Map over the correctly typed array
      const activeMemberIds = Array.from(new Set(typedRecentAttendance?.map(a => a.member_id) || []))
      
      let inactiveQuery = supabase
        .from('members')
        .select('id, full_name, phone, status')
        .in('status', ['active', 'expiring'])
      
      if (activeMemberIds.length > 0) {
        inactiveQuery = inactiveQuery.not('id', 'in', `(${activeMemberIds.join(',')})`)
      }

      const { data: inactiveData, error: inactiveErr } = await inactiveQuery.limit(10)

      if (expiringErr || inactiveErr) {
        throw new Error('Failed to fetch sidebar panel details')
      }

      // 2. Cast the expiring array explicitly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expiring = (expiringData || []).map((item: any) => ({
        id: item.members?.id,
        full_name: item.members?.full_name,
        phone: item.members?.phone,
        endDate: item.end_date,
      })).filter(item => item.id) as SidebarExpiringMember[]

      // 3. Cast the inactive array explicitly
      const inactive = (inactiveData || []) as SidebarInactiveMember[]

      return { expiring, inactive }
    }
  })
}