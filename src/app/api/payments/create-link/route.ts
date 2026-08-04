import { NextResponse } from 'next/server'
import { razorpayClient } from '@/lib/razorpay/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // 🌟 ADDED: 'purpose' to the destructured body
    const { memberId, memberName, memberPhone, amount, planName, planId, purpose } = body

    if (!memberId || !amount) {
      return NextResponse.json({ error: 'Missing memberId or amount' }, { status: 400 })
    }

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
        email: false,
      },
      reminder_enable: false,
      notes: {
        member_id: memberId,
        plan_id: planId || '',
        plan_name: planName || 'Unknown Plan',
        description: planName || 'Razorpay Payment',
        purpose: purpose || 'new_registration', 
        gym: 'altrex_fitness',
      },
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