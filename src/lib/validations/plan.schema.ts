// src/lib/validations/plan.schema.ts
import { z } from 'zod'

export const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  // Removed z.coerce, strictly enforcing number type
  duration_days: z.number().min(1, 'Duration must be at least 1 day'),
  price: z.number().min(0, 'Price cannot be negative'),
  description: z.string().optional(),
  features: z.string().optional(),
})

export type PlanFormValues = z.infer<typeof planSchema>