// src/app/api/cron/renewal-reminders/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { addDays, format } from 'date-fns'
import { sendTemplateMessage } from '@/lib/whatsapp/client'
// Adjust this import based on where your Razorpay logic lives
import { createPaymentLink } from '@/lib/razorpay/client' 

// Initialize Admin Client to bypass RLS in background jobs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // 1. Security Check: Only allow Vercel's Cron scheduler to run this
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    const targetDates = {
      today: format(today, 'yyyy-MM-dd'),
      in3Days: format(addDays(today, 3), 'yyyy-MM-dd'),
      in7Days: format(addDays(today, 7), 'yyyy-MM-dd'),
    }

    // 2. Fetch memberships ending on our target dates
    const { data: memberships, error } = await supabaseAdmin
      .from('memberships')
      .select(`
        id, 
        end_date,
        members (id, full_name, phone),
        membership_plans (id, name, price)
      `)
      .in('end_date', [targetDates.today, targetDates.in3Days, targetDates.in7Days])
      .in('status', ['active', 'expiring']) // Don't ping already cancelled ones

    if (error) throw error
    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ message: 'No reminders needed today' })
    }

    let sentCount = 0

    // 3. Process each expiring membership
    for (const record of memberships) {
      // TypeScript safety checks
      const member = Array.isArray(record.members) ? record.members[0] : record.members
      const plan = Array.isArray(record.membership_plans) ? record.membership_plans[0] : record.membership_plans
      
      if (!member?.phone || !plan?.price) continue

      // Determine which template to use based on days remaining
      let templateName = 'altrex_renewal_today'
      if (record.end_date === targetDates.in3Days) templateName = 'altrex_renewal_3d'
      if (record.end_date === targetDates.in7Days) templateName = 'altrex_renewal_7d'

      try {
        // Generate a fresh Razorpay link specific to this member's renewal
        const link = await createPaymentLink({
          memberId: member.id,
          memberName: member.full_name,
          memberPhone: member.phone,
          amount: plan.price * 100, // Convert to paise
          planName: plan.name,
          planId: plan.id,
        })

        // Fire the WhatsApp message
        await sendTemplateMessage({
          to: member.phone,
          templateName,
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: member.full_name },
                { type: 'text', text: format(new Date(record.end_date), 'dd MMM yyyy') },
                { type: 'text', text: link }
              ]
            }
          ]
        })
        
        sentCount++
      } catch (err) {
        console.error(`Failed to process reminder for ${member.full_name}:`, err)
        // We continue the loop so one failure doesn't stop the rest of the batch
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: memberships.length,
      sent: sentCount
    })

 } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}