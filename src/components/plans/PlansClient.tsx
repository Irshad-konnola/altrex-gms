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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 12

  const { data: plans, isLoading } = usePlans()
  const { createPlan, updatePlan,archivePlan } = usePlanMutations()
  
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
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6"
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
        <div className="text-center py-20 bg-muted rounded-xl border border-border">
          <p className="text-foreground font-medium">No membership plans active.</p>
<p className="text-sm text-muted-foreground mt-1">Click &quot;New plan&quot; to create your first pricing tier.</p>        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {plans.slice((page - 1) * pageSize, page * pageSize).map((plan) => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                onEdit={handleEdit} 
              />
            ))}
          </div>
          {plans.length > pageSize && (
            <div className="flex items-center justify-between px-2 py-4 border-t border-border mt-4">
              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{Math.ceil(plans.length / pageSize)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(plans.length / pageSize)} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
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