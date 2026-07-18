// src/hooks/useDashboardStats.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns'

export type DateRange = '7d' | '30d' | 'month'

export function useDashboardStats(dateRange: DateRange = 'month') {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard-stats', dateRange],
    queryFn: async () => {
      // 1. Total, Active, and Expiring counts remain the same...
      const { count: totalMembers } = await supabase.from('members').select('*', { count: 'exact', head: true }).neq('status', 'archived')
      const { count: activeMembers } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active')
      const { count: expiringSoon } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'expiring')

      // 2. Dynamic Date Calculation for Revenue
      const today = new Date()
      let startDate: Date
      let endDate: Date = today

      if (dateRange === '7d') {
        startDate = subDays(today, 7)
      } else if (dateRange === '30d') {
        startDate = subDays(today, 30)
      } else {
        // default 'month'
        startDate = startOfMonth(today)
        endDate = endOfMonth(today)
      }

      const start = format(startDate, 'yyyy-MM-dd')
      const end = format(endDate, 'yyyy-MM-dd')
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', start)
        .lte('payment_date', end)

      const typedPayments = payments as { amount: string | number }[] | null
      const revenue = typedPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

      return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        expiringSoon: expiringSoon || 0,
        revenue
      }
    }
  })
}