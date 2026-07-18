// src/components/plans/PlanCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/fromatCurrency'
import { MembershipPlan } from '@/hooks/usePlans'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  plan: MembershipPlan
  isPopular?: boolean
  onEdit: (plan: MembershipPlan) => void
}

export function PlanCard({ plan, isPopular, onEdit }: PlanCardProps) {
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
        // FIX: Explicitly added overflow-visible
        "relative flex flex-col h-full bg-dark-700 transition-all duration-200 overflow-visible",
        isPopular 
          // Made the border slightly thicker (border-2) for that extra premium pop
          ? "border-2 border-gold-500 shadow-xl shadow-gold-500/20 scale-100 lg:scale-105 z-20" 
          : "border border-dark-600 hover:border-dark-500 z-10"
      )}
    >
      {/* "Most popular" badge for the highlighted plan */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-dark-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          Most popular
        </div>
      )}

      <CardContent className="flex-1 flex flex-col p-6">
        {/* Header Section */}
        <div className="mb-6">
          <p className="text-dark-300 text-xs font-semibold tracking-wider mb-2">
            {formatDuration(plan.duration_days)}
          </p>
          <h3 className="text-white text-xl font-bold mb-4">{plan.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">
              {formatCurrency(plan.price).replace('.00', '')}
            </span>
            <span className="text-dark-400 text-sm font-medium">
              / {plan.duration_days} days
            </span>
          </div>
        </div>

        {/* Features List */}
        <div className="flex-1 space-y-3 mb-8">
          {plan.features?.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Check className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-sm text-dark-200">{feature}</span>
            </div>
          ))}
        </div>

        {/* Stats Row (Mocked data for now, hook up to DB later) */}
        <div className="grid grid-cols-3 gap-2 py-4 border-t border-dark-600 mb-6">
          <div className="text-center">
            <p className="text-white font-bold text-sm">--</p>
            <p className="text-dark-400 text-[10px] uppercase mt-0.5">Members</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-sm">--%</p>
            <p className="text-dark-400 text-[10px] uppercase mt-0.5">Retention</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-sm">--</p>
            <p className="text-dark-400 text-[10px] uppercase mt-0.5">Avg Stay</p>
          </div>
        </div>

        {/* Full-width Button */}
        <Button 
          className={cn(
            "w-full font-semibold",
            isPopular 
              ? "bg-gold-500 text-dark-900 hover:bg-gold-600" 
              : "bg-dark-800 text-white border border-dark-600 hover:bg-dark-600"
          )}
          onClick={() => onEdit(plan)}
        >
          Edit plan
        </Button>
      </CardContent>
    </Card>
  )
}