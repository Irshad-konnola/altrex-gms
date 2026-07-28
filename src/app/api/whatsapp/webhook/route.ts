// src/app/api/whatsapp/webhook/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

// Admin client to bypass RLS in the background
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1. GET ROUTE: Meta Webhook Verification
// When you plug this URL into Facebook Business Manager, it sends a GET request here to verify ownership.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  // Checks if the token matches your .env file
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
    
    // Meta sends deeply nested JSON. Safely extract the first message.
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    
    // If it's just a delivery status update and not a text message, acknowledge and ignore
    if (!message || !message.text) {
      return NextResponse.json({ status: 'ok' })
    }
    
    const fromPhone = message.from // e.g., "919876543210"
    const text = message.text.body.trim().toLowerCase()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any;

    // A. Find the member by phone number (matching the last 10 digits to ignore country code variations)
    const phoneToSearch = fromPhone.length > 10 ? fromPhone.slice(-10) : fromPhone
    
    const { data: member } = await db
      .from('members')
      .select('id, full_name, status')
      .ilike('phone', `%${phoneToSearch}%`)
      .single()

    if (!member) {
      console.warn(`[WhatsApp Bot] Unrecognized number texted the bot: ${fromPhone}`)
      return NextResponse.json({ status: 'ok' }) // Fail silently so Meta doesn't retry
    }

    // B. Get their active membership details
    const { data: membership } = await db
      .from('memberships')
      .select('end_date, membership_plans(name)')
      .eq('member_id', member.id)
      .eq('status', 'active')
      .single()

    // C. Route the Bot's Reply
    let replyText = ""
    let messageType = 'bot_reply'

    // NEW: Check if the text is exactly a number between 1 and 5
    const isRating = /^[1-5]$/.test(text)

    if (isRating) {
      // Find their most recent active PT assignment
      const { data: ptData } = await db
        .from('pt_assignments')
        .select('id, trainer_name')
        .eq('member_id', member.id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .single()

      if (ptData) {
        // Save the feedback
        await db.from('pt_feedback').insert({
          member_id: member.id,
          pt_assignment_id: ptData.id,
          trainer_name: ptData.trainer_name,
          rating: parseInt(text)
        })
        replyText = `Thanks for rating your session with ${ptData.trainer_name} a ${text}/5! We appreciate your feedback. 🏆`
        messageType = 'pt_feedback_reply'
      } else {
        replyText = "Thanks for the rating, but we couldn't find an active PT session for your account!"
      }
    }
    // Existing logic for status checks
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
      replyText = `Hi ${member.full_name}, I am the Altrex AI bot 🤖\n\nReply with:\n- HI (Check membership status)\n- RENEW (Get payment link)`
    }

    // D. Send the text message back via Meta API
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

      // E. Log the bot's reply in your database so the Owner can see it on the dashboard
      await db.from('whatsapp_logs').insert({
        member_id: member.id,
        message_type: 'bot_reply',
        to_phone: fromPhone,
        message_body: replyText,
        status: 'delivered'
      })
    } else {
      console.warn("⚠️ Cannot send WA reply: Missing API credentials in .env")
    }

    // Must return 200 OK so Meta knows we received the webhook
    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('WhatsApp Webhook Error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}