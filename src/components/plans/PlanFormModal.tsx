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
          <DialogTitle className="text-xl font-bold text-foreground">
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
                  <FormLabel className="text-muted-foreground">Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 3-Month Premium" className="bg-card border-border focus:border-gold-500" {...field} />
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
                    <FormLabel className="text-muted-foreground">Duration (Days)</FormLabel>
                    <FormControl>
                      {/* FIX: Explicitly convert target value to Number */}
                      <Input 
                        type="number" 
                        className="bg-card border-border focus:border-gold-500" 
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
      <FormLabel className="text-muted-foreground">Price (₹)</FormLabel>
      <FormControl>
        <Input 
          type="number" 
          className="bg-card border-border focus:border-gold-500" 
          {...field}
          // If the field value is exactly 0, you can choose to display an empty string or the 0 itself.
          // Spreading field handles the value automatically, we just need to fix the onChange.
          onChange={e => {
            const val = e.target.value;
            // FIX: Return an empty string if the user clears the input, otherwise return the Number
            field.onChange(val === "" ? "" : Number(val));
          }}
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
                  <FormLabel className="text-muted-foreground">Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Short tagline for the plan" className="bg-card border-border focus:border-gold-500" {...field} />
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
                  <FormLabel className="text-muted-foreground">Features (One per line)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Gym access&#10;Locker&#10;Diet plan" 
                      className="bg-card border-border focus:border-gold-500 resize-none h-24" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />


            <div className="flex justify-between items-center pt-4 border-t border-border">
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
                <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
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