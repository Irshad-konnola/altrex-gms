// src/components/payments/OverdueDuesPanel.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useOverdueMembers } from "@/hooks/useOverdueMembers"
import { usePaymentMutations } from "@/hooks/usePaymentMutations"
import { formatCurrency } from "@/lib/utils/fromatCurrency"
import { format, parseISO } from "date-fns"
import { Bell, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export function OverdueDuesPanel() {
  const { data: overdueMembers, isLoading } = useOverdueMembers()
  const { generateRazorpayLink } = usePaymentMutations()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSendReminder = async (member: any) => {
    if (!member.phone) {
      toast.error("No phone number on file for this member")
      return
    }

    setLoadingId(member.id)
    try {
      const plan = member.current_memberships?.[0]?.membership_plans
      const amount = plan?.price || 0
      const planName = plan?.name || "Membership Renewal"
      const planId = plan?.id

      if (amount <= 0) throw new Error("Could not determine plan price")

      // 1. Generate Razorpay Link
      const link = await generateRazorpayLink.mutateAsync({
        memberId: member.id,
        memberName: member.full_name,
        memberPhone: member.phone,
        amount: amount * 100, // Convert to paise
        planName: planName,
        planId: planId,
      })

      // 2. Send WhatsApp using our Bridge API
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to send reminder")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Card className="bg-dark-700 border-dark-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Overdue Dues
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
          </div>
        ) : !overdueMembers || overdueMembers.length === 0 ? (
          <p className="text-dark-300 text-sm text-center py-4">No overdue members right now.</p>
        ) : (
          <div className="space-y-4">
            {/* 🔴 FIX: Added ': any' to member below to clear the TypeScript 'never' error */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {overdueMembers.map((member: any) => {
              const plan = member.current_memberships?.[0]?.membership_plans
              const endDate = member.current_memberships?.[0]?.end_date
              
              return (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <div className="space-y-1">
                    <p className="font-medium text-white text-sm">{member.full_name}</p>
                    <p className="text-xs text-dark-300">
                      Expired: {endDate ? format(parseISO(endDate), 'MMM dd') : 'Unknown'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-red-400">
                      {formatCurrency(plan?.price || 0)}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-dark-900 h-8 px-2"
                      onClick={() => handleSendReminder(member)}
                      disabled={loadingId === member.id}
                    >
                      {loadingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}