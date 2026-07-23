// src/app/api/cron/owner-summary/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { startOfDay, endOfDay, format } from 'date-fns'
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
    const ownerPhone = process.env.OWNER_PHONE_NUMBER
    if (!ownerPhone) {
      throw new Error('OWNER_PHONE_NUMBER is not defined in environment variables')
    }

    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    // 1. Calculate Today's Total Revenue
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', start)
      .lte('created_at', end)

    if (paymentsError) throw paymentsError

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)

    // 2. Calculate Today's Total Footfall (Attendance)
    const { count: attendanceCount, error: attendanceError } = await supabaseAdmin
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true }) // head: true means we only want the count, not the data
      .gte('check_in_at', start)
      .lte('check_in_at', end)

    if (attendanceError) throw attendanceError

    // 3. Send the WhatsApp Summary to the Owner
    await sendTemplateMessage({
      to: ownerPhone,
      templateName: 'owner_daily_summary', // Matches the template from your master plan
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: format(today, 'dd MMM yyyy') }, // e.g., "23 Jul 2026"
            { type: 'text', text: totalRevenue.toString() },      // e.g., "15399"
            { type: 'text', text: (attendanceCount || 0).toString() } // e.g., "42"
          ]
        }
      ]
    })

    return NextResponse.json({ 
      success: true, 
      date: format(today, 'yyyy-MM-dd'),
      revenue: totalRevenue,
      attendance: attendanceCount 
    })

 } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}