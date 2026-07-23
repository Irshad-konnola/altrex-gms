// src/app/api/payments/razorpay/create-link/route.ts
import { NextResponse } from 'next/server'
import { razorpayClient } from '@/lib/razorpay/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberId, memberName, memberPhone, amount, planName,planId } = body

    if (!memberId || !amount) {
      return NextResponse.json({ error: 'Missing memberId or amount' }, { status: 400 })
    }

    // Razorpay strictly requires amounts in the smallest currency sub-unit (paise)
    const amountInPaise = Math.round(Number(amount) * 100)

    const paymentLink = await razorpayClient.paymentLink.create({
      amount: amountInPaise,
      currency: 'INR',
      accept_partial: false,
      description: `Altrex Fitness — ${planName || 'Membership'}`,
      customer: {
        name: memberName || 'Altrex Member',
        contact: memberPhone || '',
      },
      notify: {
        sms: false,
        email: false, // We will handle automated WhatsApp messages ourselves
      },
      reminder_enable: false,
      notes: {
        // Crucial: The webhook will read this to know whose membership to activate!
        member_id: memberId,
        plan_id: planId,
        plan_name: planName || 'Unknown Plan',
        gym: 'altrex_fitness',
      },
      // Link expires in exactly 7 days
      expire_by: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    })

    return NextResponse.json({
      success: true,
      linkId: paymentLink.id,
      shortUrl: paymentLink.short_url,
    })
 } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}