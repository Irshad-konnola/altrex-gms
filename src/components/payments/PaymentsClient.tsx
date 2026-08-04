'use client'

import { usePayments } from '@/hooks/usePayments'
import { PaymentTable } from './PaymentTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/fromatCurrency'
import { useState, useEffect } from 'react'
import { RecordPaymentPanel } from './RecordPaymentPanel'
import { OverdueDuesPanel } from './OverdueDuesPanel'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function PaymentsClient() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: payments, isLoading } = usePayments()
  const [isRecordPanelOpen, setIsRecordPanelOpen] = useState(false)
  
  // DYNAMIC CALCULATIONS BASED ON REAL DATA
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const firstDayOfWeek = new Date(today)
  firstDayOfWeek.setDate(today.getDate() - today.getDay()) // Sunday
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const validPayments = payments?.filter(p => p.status === 'paid' || !p.status) || []

  const todayPayments = validPayments.filter(p => new Date(p.created_at) >= today)
  const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  const weekPayments = validPayments.filter(p => new Date(p.created_at) >= firstDayOfWeek)
  const weekTotal = weekPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  const monthPayments = validPayments.filter(p => new Date(p.created_at) >= firstDayOfMonth)
  const monthTotal = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  useEffect(() => {
    const channel = supabase
      .channel('realtime-payments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          console.log('Live payment received!', payload)
          toast.success('Online Payment Received successfully! 💸', { duration: 5000, position: 'top-center' })
          queryClient.invalidateQueries({ queryKey: ['payments'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, queryClient])

  return (
   <div className="space-y-6 mt-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div /> 
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsRecordPanelOpen(true)} className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-bold px-5">
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={3} /> Record payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-dark-700 border-none shadow-lg">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold tracking-wider text-dark-300 uppercase mb-2">Today</h3>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">{formatCurrency(todayTotal)}</div>
            <p className="text-xs text-dark-400">{todayPayments.length} payments</p>
          </CardContent>
        </Card>
        
        <Card className="bg-dark-700 border-none shadow-lg">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold tracking-wider text-dark-300 uppercase mb-2">This Week</h3>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">{formatCurrency(weekTotal)}</div>
            <p className="text-xs text-dark-400">{weekPayments.length} payments</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-700 border-none shadow-lg">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold tracking-wider text-dark-300 uppercase mb-2">This Month</h3>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">{formatCurrency(monthTotal)}</div>
            <p className="text-xs text-dark-400">{monthPayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-dark-700 border-none shadow-xl overflow-hidden h-full">
            <div className="p-5 border-b border-dark-600 flex justify-between items-end">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Recent payments</h2>
                <p className="text-xs text-dark-400">All channels combined</p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
              </div>
            ) : (
              <PaymentTable payments={payments || []} />
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <OverdueDuesPanel />
        </div>
      </div>

      <RecordPaymentPanel isOpen={isRecordPanelOpen} onClose={() => setIsRecordPanelOpen(false)} />
    </div>
  )
}