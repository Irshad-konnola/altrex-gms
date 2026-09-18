'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { startOfMonth, endOfMonth, subDays, subMonths, format, eachDayOfInterval } from 'date-fns'
import { DateRange } from '@/hooks/useDashboardStats'

export async function getDashboardStatsAction(dateRange: DateRange = 'month') {
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { count: totalMembers } = await supabase.from('members').select('*', { count: 'exact', head: true }).neq('status', 'archived')
  const { count: activeMembers } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: expiringSoon } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'expiring')

  const today = new Date()
  let startDate: Date
  let endDate: Date = today
  let prevStartDate: Date
  let prevEndDate: Date

  if (dateRange === '7d') {
    startDate = subDays(today, 7)
    prevStartDate = subDays(startDate, 7)
    prevEndDate = startDate
  } else if (dateRange === '30d') {
    startDate = subDays(today, 30)
    prevStartDate = subDays(startDate, 30)
    prevEndDate = startDate
  } else {
    startDate = startOfMonth(today)
    endDate = endOfMonth(today)
    prevStartDate = startOfMonth(subMonths(today, 1))
    prevEndDate = endOfMonth(subMonths(today, 1))
  }

  const start = format(startDate, 'yyyy-MM-dd')
  const end = format(endDate, 'yyyy-MM-dd')
  
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('status', 'paid')
    .gte('created_at', start)
    .lte('created_at', end)

  const { data: prevPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'paid')
    .gte('created_at', format(prevStartDate, 'yyyy-MM-dd'))
    .lte('created_at', format(prevEndDate, 'yyyy-MM-dd'))

  const typedPayments = payments as { amount: string | number, created_at: string }[] | null
  const revenue = typedPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

  const prevTypedPayments = prevPayments as { amount: string | number }[] | null
  const prevRevenue = prevTypedPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

  let revenueTrend = 0
  if (prevRevenue > 0) {
    revenueTrend = Number((((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
  } else if (revenue > 0) {
    revenueTrend = 100 
  }

  const chartEndDate = (dateRange === 'month' && endDate > today) ? today : endDate
  const daysInInterval = eachDayOfInterval({ start: startDate, end: chartEndDate })
  
  const chartDataMap = new Map()
  
  daysInInterval.forEach(day => {
    const dayFormat = dateRange === 'month' ? 'dd' : 'dd MMM'
    chartDataMap.set(format(day, dayFormat), 0)
  })

  if (typedPayments) {
    typedPayments.forEach(payment => {
      if (payment.created_at) {
        const pDate = new Date(payment.created_at)
        const dayFormat = dateRange === 'month' ? 'dd' : 'dd MMM'
        const dayStr = format(pDate, dayFormat)
        
        if (chartDataMap.has(dayStr)) {
          chartDataMap.set(dayStr, chartDataMap.get(dayStr) + Number(payment.amount))
        }
      }
    })
  }

  const revenueChartData = Array.from(chartDataMap, ([day, revenue]) => ({ day, revenue }))

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
