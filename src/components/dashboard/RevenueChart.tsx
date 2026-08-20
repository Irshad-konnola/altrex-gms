// src/app/(dashboard)/components/RevenueChart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils/fromatCurrency'
import { Loader2 } from 'lucide-react'

type DailyRevenue = {
  day: string
  revenue: number
}

type RevenueChartProps = {
  data?: DailyRevenue[]
  totalRevenue?: number
  trendPercentage?: number
  isLoading?: boolean
}

export function RevenueChart({ data = [], totalRevenue = 0, trendPercentage = 0, isLoading }: RevenueChartProps) {
  const isPositive = trendPercentage >= 0

  return (
    <Card className="bg-card border-none shadow-xl shadow-black/40 mt-6 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle className="text-lg font-bold text-foreground mb-1">Revenue this month</CardTitle>
          <p className="text-xs text-muted-foreground">Daily collection across cash, UPI and card</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {isLoading ? <span className="text-transparent bg-muted animate-pulse rounded w-24 h-8 inline-block" /> : formatCurrency(totalRevenue)}
          </div>
          {!isLoading && (
            <div className={`text-xs font-medium mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{trendPercentage}% vs last month
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          {isLoading ? (
            <div className="w-full h-full flex justify-center items-center">
               <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  stroke="#707070" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#707070" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                />
                <Tooltip 
                  cursor={{ fill: '#2A2A2A' }}
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                  itemStyle={{ color: '#D4AF37' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex justify-center items-center text-muted-foreground text-sm">
              No revenue recorded for this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}