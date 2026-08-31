// src/app/api/cron/owner-summary/route.ts
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@supabase/supabase-js'
import { startOfDay, endOfDay, format, addDays } from 'date-fns'
import { sendTemplateMessage } from '@/lib/whatsapp/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ownerPhone = process.env.OWNER_PHONE_NUMBER
    if (!ownerPhone) throw new Error('OWNER_PHONE_NUMBER is not defined')

    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    // 1. Calculate Today's Total Revenue
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', start)
      .lte('created_at', end)
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

    // 2. Calculate Today's Total Footfall (Attendance)
    const { count: attendanceCount } = await supabaseAdmin
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true })
      .gte('check_in_at', start)
      .lte('check_in_at', end)

    // 3. 🌟 ADDED: Get New Members Count for Today
    const { count: newMembersCount } = await supabaseAdmin
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end)

    // 4. 🌟 ADDED: Expiring Soon (3 days) Count
    const in3DaysStr = format(addDays(today, 3), 'yyyy-MM-dd')
    const { count: expiringCount } = await supabaseAdmin
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('end_date', in3DaysStr)
      .eq('status', 'active')

    // 5. Send the WhatsApp Summary
    await sendTemplateMessage({
      to: ownerPhone,
      templateName: 'altrex_owner_daily_summary', 
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: format(today, 'dd MMM yyyy') }, 
            { type: 'text', text: (newMembersCount || 0).toString() },
            { type: 'text', text: totalRevenue.toString() }, 
            { type: 'text', text: (attendanceCount || 0).toString() },
            { type: 'text', text: (expiringCount || 0).toString() }
          ]
        }
      ]
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
