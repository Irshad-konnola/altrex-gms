'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils/fromatCurrency'

// Mock data matching the screenshot vibe (24 days)
const data = Array.from({ length: 24 }, (_, i) => ({
  day: (i + 1).toString().padStart(2, '0'),
  revenue: Math.floor(Math.random() * 4000) + 4000,
}))

export function RevenueChart() {
  return (
    <Card className="bg-dark-700 border-none shadow-xl shadow-black/40 mt-6 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle className="text-lg font-bold text-white mb-1">Revenue this month</CardTitle>
          <p className="text-xs text-dark-400">Daily collection across cash, UPI and card</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{formatCurrency(124500)}</div>
          <div className="text-xs font-medium text-green-400 mt-1">+18.4% vs last month</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
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
                tickFormatter={(value) => `${value}`}
              />
        <Tooltip 
                cursor={{ fill: '#2A2A2A' }}
                contentStyle={{ backgroundColor: '#141414', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                itemStyle={{ color: '#D4AF37' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
              />
              {/* Altrex Gold bars with rounded tops */}
              <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}