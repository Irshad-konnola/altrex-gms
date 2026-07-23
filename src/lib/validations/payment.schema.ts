// src/lib/validations/payment.schema.ts
import { z } from 'zod'

export const paymentSchema = z.object({
  member_id: z.string().min(1, 'Please select a member'),
  plan_id: z.string().min(1, 'Please select a plan'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  method: z.enum(['cash', 'upi', 'card', 'razorpay']),
  reference_number: z.string().optional(),
  send_receipt: z.boolean(),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>