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
      <SelectTrigger className="w-[160px] bg-dark-800 border-dark-600 text-white focus:ring-gold-500 focus:border-gold-500">
        <SelectValue placeholder="Select timeframe" />
      </SelectTrigger>
      <SelectContent className="bg-dark-800 border-dark-600 text-white">
        <SelectItem value="7d" className="focus:bg-dark-700 focus:text-gold-500">Last 7 days</SelectItem>
        <SelectItem value="30d" className="focus:bg-dark-700 focus:text-gold-500">Last 30 days</SelectItem>
        <SelectItem value="month" className="focus:bg-dark-700 focus:text-gold-500">This month</SelectItem>
      </SelectContent>
    </Select>
  )
}