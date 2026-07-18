import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/fromatCurrency'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value?: number | string
  type?: 'number' | 'currency'
  isLoading?: boolean
  icon: React.ReactNode
  trend?: number
  subtext?: string
}

export function StatCard({ title, value = 0, type = 'number', isLoading, icon, trend, subtext }: StatCardProps) {
  const displayValue = type === 'currency' ? formatCurrency(Number(value)) : value
  const isPositive = trend && trend > 0

  return (
    <Card className="bg-dark-700 border-none shadow-xl shadow-black/40">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        {/* Header Row: Title + Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-dark-300">
            {icon}
            <h3 className="text-xs font-semibold tracking-wider uppercase">{title}</h3>
          </div>
          {/* Trend Badge */}
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-sm",
              isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            )}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        {/* Value + Subtext */}
        <div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 bg-dark-600 mb-1" />
          ) : (
            <div className="text-3xl font-bold text-white tracking-tight">{displayValue}</div>
          )}
          
          <p className="text-xs text-dark-400 mt-1 min-h-[16px]">
            {subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}