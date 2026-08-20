// src/components/plans/PlanCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/fromatCurrency'
import { MembershipPlan } from '@/hooks/usePlans'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  plan: MembershipPlan
  onEdit: (plan: MembershipPlan) => void
}

export function PlanCard({ plan, onEdit }: PlanCardProps) {
  // Simple helper to convert days to readable months
  const formatDuration = (days: number) => {
    if (days === 30 || days === 31) return '1 MONTH'
    if (days === 90) return '3 MONTHS'
    if (days === 180) return '6 MONTHS'
    if (days === 365) return '12 MONTHS'
    return `${days} DAYS`
  }

  return (
   <Card 
      className={cn(
        "relative flex flex-col h-full bg-card transition-all duration-200 overflow-visible border border-border hover:border-gold-500 z-10"
      )}
    >
      <CardContent className="flex-1 flex flex-col p-6">
        {/* Header Section */}
        <div className="mb-6">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider mb-2">
            {formatDuration(plan.duration_days)}
          </p>
          <h3 className="text-foreground text-xl font-bold mb-4">{plan.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground">
              {formatCurrency(plan.price).replace('.00', '')}
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              / {plan.duration_days} days
            </span>
          </div>
        </div>

        {/* Features List */}
        <div className="flex-1 space-y-3 mb-8">
          {plan.features?.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Check className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>

      
        {/* Full-width Button */}
        <Button 
          className="w-full font-semibold bg-muted text-foreground border border-border hover:bg-card"
          onClick={() => onEdit(plan)}
        >
          Edit plan
        </Button>
      </CardContent>
    </Card>
  )
}