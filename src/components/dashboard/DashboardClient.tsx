'use client'

import { useState } from 'react'
import { DateRange, useDashboardStats } from '@/hooks/useDashboardStats'
import { StatCard } from './StatCard'
import { DashboardFilter } from './DashboardFilter'
import { LiveFeed } from './LiveFeed'
import { ExpiringPanel } from './ExpiringPanel'
import { InactivePanel } from './InactivePanel'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Plus, Users, UserCheck, Clock, IndianRupee } from 'lucide-react'
import Link from 'next/link'

const RevenueChart = dynamic(() => import('./RevenueChart').then(mod => mod.RevenueChart), { ssr: false })

export function DashboardClient() {
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const { data: stats, isLoading } = useDashboardStats(dateRange)

  return (
    <div className="space-y-6">
      
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Good morning, <span className="bg-gradient-to-r from-gold-300 to-gold-600 bg-clip-text text-transparent">Owner</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <DashboardFilter value={dateRange} onChange={setDateRange} />
          <Link href="/members/add">
            <Button className="bg-gradient-to-b from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-dark-950 shadow-[0_0_15px_rgba(234,179,8,0.25)] border border-gold-300/50 font-bold px-5 rounded-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={3} />
              Add member
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Row - Now completely responsive and vertically stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Members" 
          value={stats?.totalMembers} 
          icon={<Users className="h-4 w-4 text-dark-900" />}
          // trend={stats?.trends?.totalMembers} 
          // subtext={stats?.newThisMonth ? `+${stats.newThisMonth} this month` : 'Active directory'}
          isLoading={isLoading} 
        />
        <StatCard 
          title="Active Members" 
          value={stats?.activeMembers} 
          icon={<UserCheck className="h-4 w-4 text-dark-900" />}
          // trend={stats?.trends?.activeMembers}
          // subtext={stats?.retentionRate ? `${stats.retentionRate}% retention` : 'Currently active'}
          isLoading={isLoading} 
        />
        <StatCard 
          title="Expiring Soon" 
          value={stats?.expiringSoon} 
          icon={<Clock className="h-4 w-4 text-dark-900" />}
          subtext="Within 7 days"
          isLoading={isLoading} 
        />
        <StatCard 
          title="Revenue (Month)" 
          value={stats?.revenue} 
          type="currency" 
          icon={<IndianRupee className="h-4 w-4 text-dark-900" />}
          // trend={stats?.trends?.revenue}
          // subtext={stats?.revenueToday ? `₹${stats.revenueToday} today` : 'Estimated income'}
          isLoading={isLoading} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <LiveFeed />
<RevenueChart 
            data={stats?.revenueChartData} 
            totalRevenue={stats?.revenue}
            trendPercentage={stats?.trends?.revenue} // Assuming your hook provides this
            isLoading={isLoading}
          />        </div>

        <div className="space-y-6">
          <ExpiringPanel />
          <InactivePanel />
        </div>
      </div>
    </div>
  )
}