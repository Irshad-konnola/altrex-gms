'use client'

import { useState } from 'react'
import { DateRange, useDashboardStats } from '@/hooks/useDashboardStats'
import { StatCard } from './StatCard'
import { DashboardFilter } from './DashboardFilter'
import { LiveFeed } from './LiveFeed'
import { ExpiringPanel } from './ExpiringPanel'
import { InactivePanel } from './InactivePanel'
import { RevenueChart } from './RevenueChart'
import { Button } from '@/components/ui/button'
import { Plus, Users, UserCheck, Clock, IndianRupee } from 'lucide-react'
import Link from 'next/link'

export function DashboardClient() {
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const { data: stats, isLoading } = useDashboardStats(dateRange)

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Good morning, Owner</h1>
        </div>
        <div className="flex items-center gap-3">
          <DashboardFilter value={dateRange} onChange={setDateRange} />
          <Link href="/members/add">
            <Button className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-bold px-5 rounded-full">
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={3} />
              Add member
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-4 gap-4 snap-x">
        <div className="min-w-[240px] md:min-w-0 snap-start">
          <StatCard 
            title="Total Members" 
            value={stats?.totalMembers} 
            icon={<Users className="h-4 w-4" />}
            trend={4.2}
            subtext="+12 this month"
            isLoading={isLoading} 
          />
        </div>
        <div className="min-w-[240px] md:min-w-0 snap-start">
          <StatCard 
            title="Active Members" 
            value={stats?.activeMembers} 
            icon={<UserCheck className="h-4 w-4" />}
            trend={4.2}
            subtext="92% retention"
            isLoading={isLoading} 
          />
        </div>
        <div className="min-w-[240px] md:min-w-0 snap-start">
          <StatCard 
            title="Expiring Soon" 
            value={stats?.expiringSoon} 
            icon={<Clock className="h-4 w-4" />}
            subtext="Within 7 days"
            isLoading={isLoading} 
          />
        </div>
        <div className="min-w-[240px] md:min-w-0 snap-start">
          <StatCard 
            title="Revenue (Month)" 
            value={stats?.revenue} 
            type="currency" 
            icon={<IndianRupee className="h-4 w-4" />}
            trend={4.2}
            subtext="₹4,500 today"
            isLoading={isLoading} 
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <LiveFeed />
          <RevenueChart />
        </div>

        <div className="space-y-6">
          <ExpiringPanel />
          <InactivePanel />
        </div>
      </div>
    </div>
  )
}