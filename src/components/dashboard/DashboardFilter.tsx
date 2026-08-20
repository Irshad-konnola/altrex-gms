// src/components/dashboard/DashboardFilter.tsx
'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRange } from '@/hooks/useDashboardStats'

interface DashboardFilterProps {
  value: DateRange
  onChange: (value: DateRange) => void
}

export function DashboardFilter({ value, onChange }: DashboardFilterProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as DateRange)}>
      <SelectTrigger className="w-[160px] bg-muted border-border text-foreground focus:ring-gold-500 focus:border-gold-500">
        <SelectValue placeholder="Select timeframe" />
      </SelectTrigger>
      <SelectContent className="bg-muted border-border text-foreground">
        <SelectItem value="7d" className="focus:bg-card focus:text-gold-500">Last 7 days</SelectItem>
        <SelectItem value="30d" className="focus:bg-card focus:text-gold-500">Last 30 days</SelectItem>
        <SelectItem value="month" className="focus:bg-card focus:text-gold-500">This month</SelectItem>
      </SelectContent>
    </Select>
  )
}