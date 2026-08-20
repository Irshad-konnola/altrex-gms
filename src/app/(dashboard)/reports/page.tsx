// src/app/(dashboard)/reports/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Users, TrendingUp, AlertCircle, Dumbbell, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type ReportData = {
  summary: {
    total_active: number
    total_expiring: number
    total_expired: number
    active_pt: number
    monthly_revenue: number // 🌟 ADDED: Dynamic revenue field
  },
  charts: {
    status: { name: string, value: number, fill: string }[]
    revenue: { month: string, revenue: number }[]
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports/summary')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch reports", error)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    )
  }

  if (!data) return <div className="text-foreground p-8">Failed to load analytics.</div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-gold-500" />
          Analytics & Reports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track your gym&apos;s performance, member retention, and revenue.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-muted border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-sm font-medium">Active Members</h3>
            <div className="p-2 bg-green-500/10 rounded-lg"><Users className="w-4 h-4 text-green-500" /></div>
          </div>
          <p className="text-3xl font-bold text-foreground">{data.summary.total_active}</p>
        </div>

        <div className="bg-muted border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-sm font-medium">Active PT Clients</h3>
            <div className="p-2 bg-gold-500/10 rounded-lg"><Dumbbell className="w-4 h-4 text-gold-500" /></div>
          </div>
          <p className="text-3xl font-bold text-foreground">{data.summary.active_pt}</p>
        </div>

        <div className="bg-muted border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-sm font-medium">Expiring Soon (7 Days)</h3>
            <div className="p-2 bg-yellow-500/10 rounded-lg"><AlertCircle className="w-4 h-4 text-yellow-500" /></div>
          </div>
          <p className="text-3xl font-bold text-foreground">{data.summary.total_expiring}</p>
        </div>

        <div className="bg-muted border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-sm font-medium">Estimated Monthly Revenue</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-500" /></div>
          </div>
          {/* 🌟 UPDATED: Dynamic revenue with comma formatting */}
          <p className="text-3xl font-bold text-foreground">
            ₹{data.summary.monthly_revenue?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-muted border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">Revenue Trend (Last 7 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff', borderRadius: '8px' }}
                  
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Status Pie Chart */}
        <div className="bg-muted border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-foreground mb-2">Member Status Distribution</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.status}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.charts.status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Legend */}
          <div className="flex justify-center gap-4 mt-4 text-sm text-muted-foreground">
            {data.charts.status.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
