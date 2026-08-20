// src/app/api/attendance/stats/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { startOfDay, endOfDay } from 'date-fns'

// Initialize Admin Client to bypass RLS for aggregate calculations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    const { data, error } = await supabaseAdmin
      .from('attendance_logs')
      .select('member_id, check_in_at')
      .gte('check_in_at', start)
      .lte('check_in_at', end)

    if (error) throw error

    // Create an array of 24 hours filled with 0
    const hourlyCounts = Array(24).fill(0)
    
    // Track unique members per hour
    const uniqueMembersPerHour: Record<number, Set<string>> = {}
    for (let i = 0; i < 24; i++) uniqueMembersPerHour[i] = new Set()

    // Track total unique members
    const uniqueMembers = new Set<string>()

    // Increment the count for the specific hour a check-in occurred
    data.forEach((log) => {
      const hour = new Date(log.check_in_at).getHours()
      uniqueMembersPerHour[hour].add(log.member_id)
      uniqueMembers.add(log.member_id)
    })
    
    for (let i = 0; i < 24; i++) {
      hourlyCounts[i] = uniqueMembersPerHour[i].size
    }

    // Format for Recharts
    const chartData = hourlyCounts.map((count, i) => {
      const hourString = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
      return { hour: hourString, checkIns: count, rawHour: i }
    })

    // Filter to typical gym hours (5 AM to 11 PM) to make the chart look cleaner
    const gymHoursData = chartData.filter(d => d.rawHour >= 5 && d.rawHour <= 23)

    const totalFootfall = uniqueMembers.size
    
    // Find the hour with the highest check-ins
    const peakHourData = [...gymHoursData].sort((a, b) => b.checkIns - a.checkIns)[0]
    const peakHour = peakHourData && peakHourData.checkIns > 0 ? peakHourData.hour : '--'

    return NextResponse.json({
      totalFootfall,
      peakHour,
      chartData: gymHoursData
    })

  } catch (error: unknown) {
    console.error('Stats Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}