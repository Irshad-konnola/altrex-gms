// src/app/api/reports/summary/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

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
      { name: 'Active', value: activeMembers, fill: '#22c55e' }, // text-green-500
      { name: 'Expiring', value: expiringMembers, fill: '#eab308' }, // text-yellow-500
      { name: 'Expired', value: expiredMembers, fill: '#ef4444' }, // text-red-500
    ]

    // 3. Mock Revenue Data (Until Phase 10 Payment Gateway Integration)
    const revenueData = [
      { month: 'Jan', revenue: 45000 },
      { month: 'Feb', revenue: 52000 },
      { month: 'Mar', revenue: 48000 },
      { month: 'Apr', revenue: 61000 },
      { month: 'May', revenue: 59000 },
      { month: 'Jun', revenue: 75000 },
      { month: 'Jul', revenue: 82000 },
    ]

    return NextResponse.json({
      summary: {
        total_active: activeMembers,
        total_expiring: expiringMembers,
        total_expired: expiredMembers,
        active_pt: activePT
      },
      charts: {
        status: statusChartData,
        revenue: revenueData
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}