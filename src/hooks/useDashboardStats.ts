// src/hooks/useDashboardStats.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, subDays, subMonths, format, eachDayOfInterval } from 'date-fns'

export type DateRange = '7d' | '30d' | 'month'

export function useDashboardStats(dateRange: DateRange = 'month') {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard-stats', dateRange],
    queryFn: async () => {
      // 1. Get Member Counts
      const { count: totalMembers } = await supabase.from('members').select('*', { count: 'exact', head: true }).neq('status', 'archived')
      const { count: activeMembers } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active')
      const { count: expiringSoon } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'expiring')

      // 2. Dynamic Date Calculation
      const today = new Date()
      let startDate: Date
      let endDate: Date = today
      let prevStartDate: Date
      let prevEndDate: Date

      // Calculate Current and Previous Periods (for trends)
      if (dateRange === '7d') {
        startDate = subDays(today, 7)
        prevStartDate = subDays(startDate, 7)
        prevEndDate = startDate
      } else if (dateRange === '30d') {
        startDate = subDays(today, 30)
        prevStartDate = subDays(startDate, 30)
        prevEndDate = startDate
      } else {
        // default 'month'
        startDate = startOfMonth(today)
        endDate = endOfMonth(today)
        prevStartDate = startOfMonth(subMonths(today, 1))
        prevEndDate = endOfMonth(subMonths(today, 1))
      }

      const start = format(startDate, 'yyyy-MM-dd')
      const end = format(endDate, 'yyyy-MM-dd')
      
      // 3. Fetch Current Period Payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date') // 🌟 FIX: Added payment_date
        .eq('status', 'paid')
        .gte('payment_date', start)
        .lte('payment_date', end)

      // 4. Fetch Previous Period Payments
      const { data: prevPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', format(prevStartDate, 'yyyy-MM-dd'))
        .lte('payment_date', format(prevEndDate, 'yyyy-MM-dd'))

      // 5. Calculate Revenue Totals
      const typedPayments = payments as { amount: string | number, payment_date: string }[] | null
      const revenue = typedPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

      const prevTypedPayments = prevPayments as { amount: string | number }[] | null
      const prevRevenue = prevTypedPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

      // 6. Calculate Trend Percentage (Fixes TS Error 2339 on 'trends')
      let revenueTrend = 0
      if (prevRevenue > 0) {
        revenueTrend = Number((((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
      } else if (revenue > 0) {
        revenueTrend = 100 
      }

      // 7. Generate Daily Chart Data (Fixes TS Error 2339 on 'revenueChartData')
      // Stop the chart at "today" if we are in the current month to avoid flatlines in the future
      const chartEndDate = (dateRange === 'month' && endDate > today) ? today : endDate
      const daysInInterval = eachDayOfInterval({ start: startDate, end: chartEndDate })
      
      const chartDataMap = new Map()
      
      // Initialize map with 0s so empty days still show on the chart
      daysInInterval.forEach(day => {
        // Use '01' format for month view, '01 Aug' format for 7d/30d views
        const dayFormat = dateRange === 'month' ? 'dd' : 'dd MMM'
        chartDataMap.set(format(day, dayFormat), 0)
      })

      // Group actual payments into the correct days
      if (typedPayments) {
        typedPayments.forEach(payment => {
          if (payment.payment_date) {
            const pDate = new Date(payment.payment_date)
            const dayFormat = dateRange === 'month' ? 'dd' : 'dd MMM'
            const dayStr = format(pDate, dayFormat)
            
            if (chartDataMap.has(dayStr)) {
              chartDataMap.set(dayStr, chartDataMap.get(dayStr) + Number(payment.amount))
            }
          }
        })
      }

      // Convert Map back to array for Recharts
      const revenueChartData = Array.from(chartDataMap, ([day, revenue]) => ({ day, revenue }))

      // Return the exact structure expected by DashboardClient
      return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        expiringSoon: expiringSoon || 0,
        revenue,
        trends: {
          revenue: revenueTrend
        },
        revenueChartData
      }
    }
  })
}