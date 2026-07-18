// src/components/plans/PlanFormModal.tsx
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { planSchema, PlanFormValues } from '@/lib/validations/plan.schema'
import { MembershipPlan } from '@/hooks/usePlans'
import { Loader2 } from 'lucide-react'

interface PlanFormModalProps {
  isOpen: boolean
  onClose: () => void
  plan: MembershipPlan | null
  onSubmit: (data: PlanFormValues) => void
  isSubmitting?: boolean
  onArchive?: (id: string) => void
}

export function PlanFormModal({ isOpen, onClose, plan, onSubmit, isSubmitting,onArchive }: PlanFormModalProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      duration_days: 30,
      price: 0,
      description: '',
      features: '',
    },
  })

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        duration_days: plan.duration_days,
        price: plan.price,
        description: plan.description || '',
        features: plan.features?.join('\n') || '',
      })
    } else {
      form.reset({
        name: '',
        duration_days: 30,
        price: 0,
        description: '',
        features: '',
      })
    }
  }, [plan, isOpen, form])

  const handleSubmit = (values: PlanFormValues) => {
    onSubmit(values)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {plan ? 'Edit Membership Plan' : 'Create New Plan'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark-300">Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 3-Month Premium" className="bg-dark-900 border-dark-600 focus:border-gold-500" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dark-300">Duration (Days)</FormLabel>
                    <FormControl>
                      {/* FIX: Explicitly convert target value to Number */}
                      <Input 
                        type="number" 
                        className="bg-dark-900 border-dark-600 focus:border-gold-500" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dark-300">Price (₹)</FormLabel>
                    <FormControl>
                      {/* FIX: Explicitly convert target value to Number */}
                      <Input 
                        type="number" 
                        className="bg-dark-900 border-dark-600 focus:border-gold-500" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark-300">Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Short tagline for the plan" className="bg-dark-900 border-dark-600 focus:border-gold-500" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark-300">Features (One per line)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Gym access&#10;Locker&#10;Diet plan" 
                      className="bg-dark-900 border-dark-600 focus:border-gold-500 resize-none h-24" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />


            <div className="flex justify-between items-center pt-4 border-t border-dark-600">
            <div>
                {plan && onArchive && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    onClick={() => {
                      if (confirm('Are you sure you want to archive this plan? Existing members will not be affected.')) {
                        onArchive(plan.id) 
                      }
                    }}
                  >
                    Archive Plan
                  </Button>
                )}
              </div>

              {/* Right side: Cancel and Save */}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onClose} className="text-dark-300 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-semibold">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Plan'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}