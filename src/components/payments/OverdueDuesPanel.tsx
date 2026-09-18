'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useOverdueMembers } from "@/hooks/useOverdueMembers"
import { usePaymentMutations } from "@/hooks/usePaymentMutations"
import { formatCurrency } from "@/lib/utils/fromatCurrency"
import { Bell, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export function OverdueDuesPanel() {
  const { data: overdueMembers, isLoading } = useOverdueMembers()
  
  const { generateRazorpayLink } = usePaymentMutations()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleSendReminder = async (member: any) => {
    if (!member.phone) {
      toast.error("No phone number on file for this member")
      return
    }

    setLoadingId(member.id)
    try {
      const amount = member.due_amount || 0
      const planName = "Pending Dues"
      const planId = "" // Empty string or undefined

      // 1. Generate Razorpay Link
      const link = await generateRazorpayLink.mutateAsync({
        memberId: member.id,
        memberName: member.full_name,
        memberPhone: member.phone,
        amount: amount * 100, // Convert to paise
        planName: planName,
        planId: planId,
      })

      // 2. Send WhatsApp Message
      const waResponse = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: member.phone,
          templateName: 'altrex_renewal_today', 
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: member.full_name },
                { type: 'text', text: link }
              ]
            }
          ]
        })
      })

      if (!waResponse.ok) throw new Error("Failed to send WhatsApp message")

      toast.success(`Reminder sent to ${member.full_name}`)
      
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to send reminder")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card className="h-full bg-card border-border shadow-md">
      <CardHeader className="pb-3 border-b border-border bg-muted/50 rounded-t-xl">
        <CardTitle className="text-sm font-semibold flex items-center text-red-500">
          <AlertCircle className="h-4 w-4 mr-2" />
          Pending Dues
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[350px] overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-gold-500" /></div>
          ) : !overdueMembers || overdueMembers.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No pending dues found.
            </div>
          ) : (
            <div className="divide-y divide-dark-800/50">
              {overdueMembers.map((member: any) => {
                const amount = member.due_amount
                
                return (
                  <div key={member.id} className="flex flex-col gap-2 p-4 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground text-sm">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="font-medium text-red-400">{formatCurrency(amount || 0)}</span>
                          <span className="text-dark-600">•</span>
                          {member.phone}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-gold-500/50 text-gold-500 hover:bg-gold-500 hover:text-dark-900 h-8 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleSendReminder(member)}
                        disabled={loadingId === member.id}
                      >
                        {loadingId === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Bell className="h-3.5 w-3.5" />
                            <span className="ml-1.5 text-xs font-semibold">Remind</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
