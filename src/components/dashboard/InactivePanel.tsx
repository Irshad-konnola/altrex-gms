// src/components/dashboard/InactivePanel.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSidebarPanels } from '@/hooks/useSidebarPanels'
import { Loader2, PhoneCall } from 'lucide-react'
import { toast } from 'sonner'

export function InactivePanel() {
  const { data, isLoading } = useSidebarPanels()

  const handleFollowUp = (name: string) => {
    toast.success(`Follow-up context opened for ${name}`)
  }

  return (
    <Card className="bg-card border-border rounded-xl">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-semibold text-foreground">
          Inactive 3+ Days
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gold-500" />
          </div>
        ) : !data?.inactive.length ? (
          <p className="text-xs text-muted-foreground py-2">All active members seen recently.</p>
        ) : (
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {data.inactive.map((member) => (
              <div key={member.id} className="flex items-center justify-between text-xs bg-muted p-2.5 rounded-lg border border-border">
                <div className="min-w-0">
                  <p className="text-foreground font-medium truncate">{member.full_name}</p>
                  <p className="text-muted-foreground mt-0.5">Absent since last week</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-7 text-[11px] text-gold-500 hover:text-gold-600 hover:bg-gold-500/10 shrink-0 gap-1.5"
                  onClick={() => handleFollowUp(member.full_name)}
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  Follow Up
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}