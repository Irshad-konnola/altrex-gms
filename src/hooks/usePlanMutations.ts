// src/hooks/usePlanMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PlanFormValues } from '@/lib/validations/plan.schema'
import { toast } from 'sonner'

export type PlanMutationPayload = Omit<PlanFormValues, 'features'> & {
  features: string[]
}

export function usePlanMutations() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Create Plan Mutation
  const createPlan = useMutation({
    mutationFn: async (newPlan: PlanMutationPayload) => {
      const { data: highestOrder } = await supabase
        .from('membership_plans')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      const typedOrder = highestOrder as { sort_order: number } | null
      const nextOrder = typedOrder?.sort_order ? typedOrder.sort_order + 1 : 1

      const payload = { ...newPlan, sort_order: nextOrder }

      // FIX: Cast the entire query builder to 'any' to bypass the 'never' restriction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('membership_plans') as any)
        .insert([payload])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Membership plan created successfully')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Failed to create plan')
    }
  })

  // Update Plan Mutation
  const updatePlan = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: PlanMutationPayload }) => {
      // FIX: Cast the entire query builder to 'any' to bypass the 'never' restriction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('membership_plans') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Membership plan updated successfully')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Failed to update plan')
    }
  })


  // Archive Plan Mutation (Soft Delete)
  const archivePlan = useMutation({
    mutationFn: async (id: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('membership_plans') as any)
        .update({ is_active: false }) // Simply hide it from the active list
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan archived successfully')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Failed to archive plan')
    }
  })

  return { createPlan, updatePlan, archivePlan }

}