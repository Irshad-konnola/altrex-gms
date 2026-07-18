// src/components/dashboard/LiveFeed.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAttendanceFeed } from '@/hooks/useAttendanceFeed'
import { format } from 'date-fns'
import Link from 'next/link'
export function LiveFeed() {
  const feed = useAttendanceFeed()

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': 
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'expiring': 
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'expired': 
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: 
        return 'bg-dark-600 text-dark-300 border-dark-500'
    }
  }

  const getMethodTag = (method: string) => {
    switch (method) {
      case 'face': return 'FACE'
      case 'fingerprint': return 'FINGER'
      case 'card': return 'CARD'
      case 'manual': return 'MANUAL'
      default: return method.toUpperCase()
    }
  }

  return (
    <Card className="bg-dark-700 border-dark-600 rounded-xl h-full flex flex-col">
    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-dark-600/50">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base font-bold text-white">Live attendance feed</CardTitle>
          <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        </div>
        <Link href="/attendance" className="text-xs font-medium text-gold-500 hover:text-gold-400">
          View all
        </Link>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-[400px] overflow-y-auto divide-y divide-dark-600 custom-scrollbar">
          {feed.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6 text-dark-400 text-sm">
              Waiting for check-ins...
            </div>
          ) : (
            feed.map((log) => (
              <div 
                key={log.id} 
                className="flex items-center justify-between p-4 hover:bg-dark-600/50 transition-colors animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar fallback */}
                  <div className="h-10 w-10 shrink-0 rounded-full bg-dark-800 flex items-center justify-center text-gold-500 font-bold border border-dark-500">
                    {log.members?.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate max-w-[120px] sm:max-w-[200px]">
                      {log.members?.full_name || 'Unknown Member'}
                    </p>
                    <p className="text-dark-400 text-xs mt-0.5">
                      {format(new Date(log.check_in_at), 'hh:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] hidden sm:inline-flex bg-dark-800 text-dark-300 border-dark-500">
                    {getMethodTag(log.method)}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${getStatusColor(log.members?.status)}`}>
                    {log.members?.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}