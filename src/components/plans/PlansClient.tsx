// src/components/plans/PlansClient.tsx
'use client'

import { useState } from 'react'
import { usePlans, MembershipPlan } from '@/hooks/usePlans'
import { usePlanMutations } from '@/hooks/usePlanMutations'
import { PlanCard } from './PlanCard'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { PlanFormModal } from './PlanFormModal'
import { PlanFormValues } from '@/lib/validations/plan.schema'

export function PlansClient() {
  const { data: plans, isLoading } = usePlans()
  const { createPlan, updatePlan,archivePlan } = usePlanMutations()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)

  const handleEdit = (plan: MembershipPlan) => {
    setSelectedPlan(plan)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedPlan(null)
    setIsModalOpen(true)
  }

  const handleArchive = (id: string) => {
    archivePlan.mutate(id, { 
      onSuccess: () => setIsModalOpen(false) 
    })
  }

 const handleFormSubmit = async (values: PlanFormValues) => {
    // FIX: Destructure features out so it doesn't conflict
    const { features, ...restValues } = values

    // Parse the features string back into an array for the DB
    const featuresArray = features
      ? features.split('\n').map(f => f.trim()).filter(Boolean)
      : []

    // Now the payload perfectly matches PlanMutationPayload
    const payload = {
      ...restValues,
      features: featuresArray,
    }

    if (selectedPlan) {
      updatePlan.mutate(
        { id: selectedPlan.id, updates: payload },
        { onSuccess: () => setIsModalOpen(false) }
      )
    } else {
      createPlan.mutate(
        payload,
        { onSuccess: () => setIsModalOpen(false) }
      )
    }
  }

const isSubmitting = createPlan.isPending || updatePlan.isPending || archivePlan.isPending

  return (
    <div className="space-y-8 mt-2">
      <div className="flex justify-between items-center">
        <div /> 
        <Button 
          onClick={handleCreate}
          className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-semibold px-6"
        >
          <Plus className="h-4 w-4 mr-2" strokeWidth={3} />
          New plan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      ) : !plans?.length ? (
        <div className="text-center py-20 bg-dark-800 rounded-xl border border-dark-600">
          <p className="text-white font-medium">No membership plans active.</p>
<p className="text-sm text-dark-400 mt-1">Click &quot;New plan&quot; to create your first pricing tier.</p>        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 lg:gap-8 pt-8 pb-4">
          {plans.map((plan, index) => {
            const isPopular = index === 1 
            return (
              <div key={plan.id} className="w-full sm:w-[320px] lg:w-85">
                <PlanCard 
                  plan={plan}
                  isPopular={isPopular}
                  onEdit={handleEdit} 
                />
              </div>
            )
          })}
        </div>
      )}

      <PlanFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={selectedPlan}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        onArchive={handleArchive}
      />
    </div>
  )
}