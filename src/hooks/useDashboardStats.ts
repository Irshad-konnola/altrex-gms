import { useQuery } from '@tanstack/react-query'
import { getDashboardStatsAction } from '@/app/(dashboard)/dashboardActions'

export type DateRange = '7d' | '30d' | 'month'

export function useDashboardStats(dateRange: DateRange = 'month') {
  return useQuery({
    queryKey: ['dashboard-stats', dateRange],
    queryFn: async () => {
      return await getDashboardStatsAction(dateRange)
    }
  })
}
