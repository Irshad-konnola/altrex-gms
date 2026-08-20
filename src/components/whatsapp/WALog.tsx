// src/components/whatsapp/WALog.tsx
"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CheckCircle2, Clock, AlertCircle, MessageSquare } from "lucide-react"

type LogEntry = {
  id: string
  message_type: string
  to_phone: string
  status: string
  sent_at: string
  members?: { full_name: string }
}

export function WALog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/whatsapp/logs')
        if (res.ok) {
          const data = await res.json()
          setLogs(data)
        }
      } catch (error) {
        console.error("Failed to load WA logs", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'read':
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />
    }
  }

  const formatMessageType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading message history...</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-card/50 text-muted-foreground uppercase tracking-wider font-medium text-xs border-b border-border">
          <tr>
            <th className="p-4">Recipient</th>
            <th className="p-4">Message Type</th>
            <th className="p-4">Sent At</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-600/50">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-muted-foreground">
                No messages sent yet.
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="hover:bg-card/30 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-foreground">
                    {log.members?.full_name || 'System / Owner'}
                  </div>
                  <div className="text-xs text-muted-foreground">{log.to_phone}</div>
                </td>
                <td className="p-4">
                  <span className="bg-card text-gold-400 border border-border px-2 py-1 rounded-md text-xs font-medium">
                    {formatMessageType(log.message_type)}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  {format(new Date(log.sent_at), "dd MMM yyyy, hh:mm a")}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="capitalize text-foreground">{log.status}</span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}