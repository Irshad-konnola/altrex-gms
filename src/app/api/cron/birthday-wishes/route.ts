import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTemplateMessage } from '@/lib/whatsapp/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all active members who have a date of birth recorded
    const { data: members, error } = await supabaseAdmin
      .from('members')
      .select('id, full_name, phone, date_of_birth')
      .eq('status', 'active')
      .not('date_of_birth', 'is', null)

    if (error) throw error

    const today = new Date()
    const currentMonth = today.getMonth()
    const currentDate = today.getDate()

    let sentCount = 0

    for (const member of members) {
      if (!member.phone || !member.date_of_birth) continue

      const dob = new Date(member.date_of_birth)
      
      // Match month and day (ignoring the year)
      if (dob.getMonth() === currentMonth && dob.getDate() === currentDate) {
        try {
          await sendTemplateMessage({
            to: member.phone,
            templateName: 'altrex_birthday',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: member.full_name }
                ]
              }
            ]
          })
          sentCount++
        } catch (waError) {
          console.error(`Failed to send birthday wish to ${member.phone}:`, waError)
        }
      }
    }

    return NextResponse.json({ success: true, wishesSent: sentCount })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Birthday Cron Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}