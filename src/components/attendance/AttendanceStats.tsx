// src/components/attendance/AttendanceStats.tsx
"use client"

import { useEffect, useState } from "react"
import { Users, Clock, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface StatsData {
  totalFootfall: number
  peakHour: string
  chartData: { hour: string; checkIns: number }[]
}

export function AttendanceStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/attendance/stats')
        const data = await response.json()
        if (response.ok) {
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch attendance stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Optional: Refresh stats every 5 minutes to keep it relatively live
    const interval = setInterval(fetchStats, 300000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 h-48 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's Overview Widget */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 shadow-sm">
        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-dark-300">
          Today&apos;s Overview
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-dark-700/50">
            <div className="flex items-center gap-3 text-dark-200">
              <Users className="w-5 h-5 text-gold-500" />
              <span className="font-medium">Total Footfall</span>
            </div>
            <span className="text-xl font-bold text-white">{stats.totalFootfall}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-dark-700/50">
            <div className="flex items-center gap-3 text-dark-200">
              <Clock className="w-5 h-5 text-gold-500" />
              <span className="font-medium">Peak Hour</span>
            </div>
            <span className="text-xl font-bold text-white">{stats.peakHour}</span>
          </div>
        </div>
      </div>

      {/* Hourly Chart */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 shadow-sm">
        <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider text-dark-300">
          Check-in Distribution
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="hour" 
                stroke="#707070" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                interval={2} // Show every 3rd label to prevent crowding
              />
              <YAxis 
                stroke="#707070" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: '#2A2A2A' }}
                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #404040', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#D4AF37' }}
              />
              <Bar dataKey="checkIns" radius={[4, 4, 0, 0]}>
                {stats.chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.checkIns > 0 ? '#D4AF37' : '#2A2A2A'} 
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}