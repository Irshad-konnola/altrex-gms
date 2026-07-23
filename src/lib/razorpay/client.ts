// src/lib/razorpay/client.ts
import Razorpay from 'razorpay'

// Ensure we don't crash the server if keys are temporarily missing during dev
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ Razorpay keys are missing from .env.local')
}

export const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
})

interface PaymentLinkParams {
  memberId: string
  memberName: string
  memberPhone?: string
  amount: number
  planName: string
  planId?: string
  expiryMinutes?: number
}

export async function createPaymentLink({
  memberId,
  memberName,
  memberPhone,
  amount,
  planName,
  expiryMinutes = 10080, // 7 days default
}: PaymentLinkParams) {
  // If we are using dummy keys, return a fake link to prevent API crashes during local testing
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key_id') {
    console.warn(`[Razorpay Stub] Bypassing API. Would have generated ₹${amount / 100} link for ${memberName}`)
    return 'https://rzp.io/i/dummy-test-link'
  }

  const link = await razorpayClient.paymentLink.create({
    amount,
    currency: 'INR',
    description: `Altrex Fitness — ${planName}`,
    customer: {
      name: memberName,
      contact: memberPhone || '',
    },
    // We disable Razorpay's default SMS/Email because we send our own WhatsApp messages
    notify: { sms: false, email: false },
    reminder_enable: false,
    notes: {
      member_id: memberId,
      plan_name: planName,
      gym: 'altrex_fitness',
    },
    expire_by: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-success`,
    callback_method: 'get',
  })

  return link.short_url
}