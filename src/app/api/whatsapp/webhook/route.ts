// src/app/api/whatsapp/webhook/route.ts
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1. GET ROUTE: Meta Webhook Verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log("🟢 WhatsApp Webhook Verified!")
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// 2. POST ROUTE: Incoming Messages & Bot Replies
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    
    if (!message || !message.text) {
      return NextResponse.json({ status: 'ok' })
    }
    
    const fromPhone = message.from
    const text = message.text.body.trim().toLowerCase()
    
    
    const db = supabaseAdmin as any;

    const phoneToSearch = fromPhone.length > 10 ? fromPhone.slice(-10) : fromPhone
    
    const { data: member } = await db
      .from('members')
      .select('id, full_name, status')
      .ilike('phone', `%${phoneToSearch}%`)
      .single()

    if (!member) {
      console.warn(`[WhatsApp Bot] Unrecognized number texted the bot: ${fromPhone}`)
      return NextResponse.json({ status: 'ok' }) 
    }

    const { data: membership } = await db
      .from('memberships')
      .select('end_date, membership_plans(name)')
      .eq('member_id', member.id)
      .eq('status', 'active')
      .single()

    let replyText = ""
    let messageType = 'bot_reply'

    // 🌟 SMART PARSING: Is it a number?
    const numericValue = Number(text)
    const isNumeric = !isNaN(numericValue)

    if (isNumeric) {
      if (numericValue >= 1 && numericValue <= 5) {
        // SCENARIO A: It's PT Feedback (1-5)
        const { data: ptData } = await db
          .from('pt_assignments')
          .select('id, trainer_name')
          .eq('member_id', member.id)
          .eq('status', 'active')
          .order('start_date', { ascending: false })
          .limit(1)
          .single()

        if (ptData) {
          await db.from('pt_feedback').insert({
            member_id: member.id,
            pt_assignment_id: ptData.id,
            trainer_name: ptData.trainer_name,
            rating: numericValue
          })
          replyText = `Thanks for rating your session with ${ptData.trainer_name} a ${text}/5! We appreciate your feedback. 🏆`
          messageType = 'pt_feedback_reply'
        } else {
          replyText = "Thanks for the rating, but we couldn't find an active PT session for your account!"
        }
      } else if (numericValue > 15 && numericValue < 200) {
        // SCENARIO B: It's a Weight/BMI Update (e.g., 75kg)
        await db.from('members').update({ bmi: numericValue }).eq('id', member.id)
        replyText = `Got it, ${member.full_name}! We have updated your weight profile to ${numericValue}kg. Keep pushing! 🏋️‍♂️`
        messageType = 'bmi_update_reply'
      } else {
        replyText = `I didn't quite understand that number. Please reply with a rating (1-5) or your weight in kg.`
      }
    } 
    else if (['hi', 'hello', 'status', 'membership'].includes(text)) {
      const endDate = membership?.end_date 
        ? format(new Date(membership.end_date), 'dd MMM yyyy') 
        : 'No active plan'
      const planName = membership?.membership_plans?.name || 'N/A'
      
      replyText = `Hi ${member.full_name}, here is your Altrex Fitness status: 💪\n\nPlan: ${planName}\nStatus: ${member.status.toUpperCase()}\nValid until: ${endDate}\n\nReply RENEW to get a payment link.`
    } 
    else if (text === 'renew') {
      replyText = `Hi ${member.full_name}, generating your secure Razorpay link...\n\n(Payment link module coming soon!)`
    } 
    else {
      replyText = `Hi ${member.full_name}, I am the Altrex AI bot 🤖\n\nReply with:\n- HI (Check membership status)\n- RENEW (Get payment link)\n- Or simply reply with your current weight in kg!`
    }

    // Send the reply back to the user
    if (process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
      const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`
      
      await fetch(WA_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: fromPhone,
          type: 'text',
          text: { body: replyText }
        })
      })

      // Log the conversation for the dashboard
      await db.from('whatsapp_logs').insert({
        member_id: member.id,
        message_type: messageType,
        to_phone: fromPhone,
        message_body: replyText,
        status: 'delivered'
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
