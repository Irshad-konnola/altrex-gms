// src/app/api/cron/inactivity-check/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { differenceInDays } from 'date-fns'
import { sendTemplateMessage } from '@/lib/whatsapp/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Security Check
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch all ACTIVE members and their plan end dates
    const { data: activeMembers, error: membersError } = await supabaseAdmin
      .from('members')
      .select(`
        id, 
        full_name, 
        phone,
        current_memberships (end_date)
      `)
      .eq('status', 'active')

    if (membersError) throw membersError
    if (!activeMembers || activeMembers.length === 0) {
      return NextResponse.json({ message: 'No active members to check' })
    }

    let sentCount = 0
    const today = new Date()

    // 2. Loop through members to check their last attendance
    for (const member of activeMembers) {
      if (!member.phone) continue

      const membership = Array.isArray(member.current_memberships) 
        ? member.current_memberships[0] 
        : member.current_memberships

      if (!membership?.end_date) continue

      // Calculate how many days are left on their plan (for the WhatsApp variable)
      const daysLeft = differenceInDays(new Date(membership.end_date), today)

      // 3. Fetch their MOST RECENT check-in
      const { data: lastCheckIn } = await supabaseAdmin
        .from('attendance_logs')
        .select('check_in_at')
        .eq('member_id', member.id)
        .order('check_in_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastCheckIn) continue // Skip if they've never checked in

      // 4. Calculate days since last check-in
      const daysSinceLastVisit = differenceInDays(today, new Date(lastCheckIn.check_in_at))

      // 5. Send templates for exactly 3 or 7 days of inactivity
      if (daysSinceLastVisit === 3 || daysSinceLastVisit === 7) {
        const templateName = daysSinceLastVisit === 3 ? 'inactivity_3d' : 'inactivity_7d'
        const dateVariable = daysSinceLastVisit === 3 ? daysLeft.toString() : membership.end_date // based on your template design

        try {
          await sendTemplateMessage({
            to: member.phone,
            templateName,
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: member.full_name },
                  { type: 'text', text: dateVariable } // Matches the variables in your master plan templates
                ]
              }
            ]
          })
          sentCount++
        } catch (err) {
          console.error(`Failed to send inactivity ping to ${member.full_name}:`, err)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      checked: activeMembers.length,
      sent: sentCount 
    })

 } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}