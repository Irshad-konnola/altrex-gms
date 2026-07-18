// src/components/dashboard/ExpiringPanel.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSidebarPanels } from '@/hooks/useSidebarPanels'
import { Loader2, MessageSquare } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { toast } from 'sonner'

export function ExpiringPanel() {
  const { data, isLoading } = useSidebarPanels()

  const handleRemind = async (memberId: string, name: string) => {
    try {
      // Placeholder for your Phase 6 WhatsApp API call
      toast.success(`Queued renewal reminder for ${name}`)
    }
     catch
      // (error)
      {
      // toast.error('Failed to send reminder notification')
    }
  }

  return (
    <Card className="bg-dark-700 border-dark-600 rounded-xl">
      <CardHeader className="pb-3 border-b border-dark-600">
        <CardTitle className="text-sm font-semibold text-white">
          Expiring This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gold-500" />
          </div>
        ) : !data?.expiring.length ? (
          <p className="text-xs text-dark-400 py-2">No memberships expiring this week.</p>
        ) : (
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {data.expiring.map((member) => {
              const daysLeft = differenceInDays(new Date(member.endDate), new Date())
              
              return (
                <div key={member.id} className="flex items-center justify-between text-xs bg-dark-800 p-2.5 rounded-lg border border-dark-600">
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{member.full_name}</p>
                    <p className="text-yellow-400 font-semibold mt-0.5">
                      {daysLeft <= 0 ? 'Expires today' : `${daysLeft} days remaining`}
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    variant="ghost" 
                    className="h-7 text-[11px] text-gold-500 hover:text-gold-600 hover:bg-gold-500/10 shrink-0 gap-1.5"
                    onClick={() => handleRemind(member.id, member.full_name)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Remind
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}