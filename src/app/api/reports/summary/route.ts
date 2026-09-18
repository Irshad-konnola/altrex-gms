// src/app/api/reports/summary/route.ts
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { startOfMonth, subMonths, format } from 'date-fns'

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const db = supabaseAdmin as any

    // 1. Get Member Status Counts
    const { data: members, error: memberError } = await db
      .from('members')
      .select('status, is_pt_member')

    if (memberError) throw memberError

    let activeMembers = 0
    let expiringMembers = 0
    let expiredMembers = 0
    let activePT = 0

    members.forEach((m: any) => {
      if (m.status === 'active') activeMembers++
      if (m.status === 'expiring') expiringMembers++
      if (m.status === 'expired') expiredMembers++
      if (m.is_pt_member) activePT++
    })

    // 2. Format Data for the Chart
    const statusChartData = [
      { name: 'Active', value: activeMembers, fill: '#22c55e' },
      { name: 'Expiring', value: expiringMembers, fill: '#eab308' },
      { name: 'Expired', value: expiredMembers, fill: '#ef4444' },
    ]

    // 3. Dynamic Revenue Data (Last 7 Months)
    const today = new Date()
    const sevenMonthsAgo = startOfMonth(subMonths(today, 6)).toISOString()

    const { data: payments, error: paymentsError } = await db
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'paid')
      .gte('created_at', sevenMonthsAgo)

    if (paymentsError) throw paymentsError

    const revenueMap = new Map()
    for (let i = 6; i >= 0; i--) {
      const monthDate = subMonths(today, i)
      const monthName = format(monthDate, 'MMM')
      revenueMap.set(monthName, 0)
    }

    if (payments) {
      payments.forEach((payment: any) => {
        const paymentMonth = format(new Date(payment.created_at), 'MMM')
        if (revenueMap.has(paymentMonth)) {
          revenueMap.set(paymentMonth, revenueMap.get(paymentMonth) + Number(payment.amount))
        }
      })
    }

    const revenueData = Array.from(revenueMap, ([month, revenue]) => ({ month, revenue }))
    const currentMonthName = format(today, 'MMM')
    const currentMonthlyRevenue = revenueMap.get(currentMonthName) || 0

    return NextResponse.json({
      summary: {
        total_active: activeMembers,
        total_expiring: expiringMembers,
        total_expired: expiredMembers,
        active_pt: activePT,
        monthly_revenue: currentMonthlyRevenue 
      },
      charts: {
        status: statusChartData,
        revenue: revenueData 
      }
    })
  } catch (error: unknown) {
    console.error('Reports API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
