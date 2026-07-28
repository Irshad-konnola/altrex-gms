// src/components/attendance/LiveFeed.tsx
"use client"

import { useAttendanceFeed } from "@/hooks/useAttendanceFeed"
import { format } from "date-fns"
import { User, Fingerprint, ScanFace, CreditCard, Keyboard } from "lucide-react"

export function LiveFeed() {
  const feed = useAttendanceFeed()

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'face': return <ScanFace className="w-4 h-4 text-dark-300" />
      case 'fingerprint': return <Fingerprint className="w-4 h-4 text-dark-300" />
      case 'card': return <CreditCard className="w-4 h-4 text-dark-300" />
      case 'manual': return <Keyboard className="w-4 h-4 text-dark-300" />
      default: return <User className="w-4 h-4 text-dark-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'expiring': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-dark-700 text-dark-300 border-dark-600'
    }
  }

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-dark-600 flex justify-between items-center bg-dark-900/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Attendance
        </h2>
        <span className="text-xs text-dark-300 font-medium bg-dark-700 px-2 py-1 rounded-md">
          {feed.length} Recent Scans
        </span>
      </div>

      <div className="divide-y divide-dark-600/50 max-h-[600px] overflow-y-auto">
        {feed.length === 0 ? (
          <div className="p-8 text-center text-dark-400 text-sm">
            Waiting for device scans...
          </div>
        ) : (
          feed.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-dark-700/30 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar Placeholder */}
                <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center border border-dark-600">
                  <User className="w-5 h-5 text-dark-400" />
                </div>
                
                <div>
                  <p className="text-white font-medium">{log.members?.full_name || 'Unknown Member'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getMethodIcon(log.method)}
                    <span className="text-xs text-dark-400 uppercase tracking-wider font-medium">
                      {log.method}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-medium text-white">
                  {format(new Date(log.check_in_at), "hh:mm a")}
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getStatusColor(log.members?.status)}`}>
                  {log.members?.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}