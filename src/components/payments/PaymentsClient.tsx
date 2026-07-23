// src/components/payments/PaymentsClient.tsx
'use client'

import { usePayments } from '@/hooks/usePayments'
import { PaymentTable } from './PaymentTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Plus, Loader2 } from 'lucide-react'
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
  
  // Note: These calculations should eventually be moved to a backend aggregate route or a custom hook
  // for performance, but this perfectly mocks the UI for now.
  const todayTotal = payments?.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0) || 15399
  const weekTotal = 84200
  const monthTotal = 124500
  const pendingDues = 3600

  useEffect(() => {
    const channel = supabase
      .channel('realtime-payments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          console.log('Live payment received!', payload)
          
          // 🔴 ADD THIS LOUD NOTIFICATION
          toast.success('Online Payment Received successfully! 💸', {
            duration: 5000,
            position: 'top-center'
          })

          queryClient.invalidateQueries({ queryKey: ['payments'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  return (
   <div className="space-y-6 mt-2">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div /> 
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-dark-500 text-white hover:bg-dark-700 bg-dark-800">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => setIsRecordPanelOpen(true)}
            className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-bold px-5"
          >
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={3} />
            Record payment
          </Button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-dark-700 border-none shadow-lg">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold tracking-wider text-dark-300 uppercase mb-2">Today</h3>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">{formatCurrency(todayTotal)}</div>
            <p className="text-xs text-dark-400">9 payments</p>
          </CardContent>
        </Card>
        
        <Card className="bg-dark-700 border-none shadow-lg">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold tracking-wider text-dark-300 uppercase mb-2">This Week</h3>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">{formatCurrency(weekTotal)}</div>
            <p className="text-xs text-dark-400">42 payments</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-700 border-none shadow-lg">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold tracking-wider text-dark-300 uppercase mb-2">This Month</h3>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">{formatCurrency(monthTotal)}</div>
            <p className="text-xs text-dark-400">+18%</p>
          </CardContent>
        </Card>

        {/* Pending Dues - Highlighted with Gold Border */}
        <Card className="bg-dark-800 border border-gold-500/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold tracking-wider text-gold-500 uppercase mb-2">Pending Dues</h3>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">{formatCurrency(pendingDues)}</div>
            <p className="text-xs text-dark-400">3 members</p>
          </CardContent>
        </Card>
      </div>

      {/* Lower Section: Table & Overdue Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Table (Takes 2 cols on large screens) */}
        <div className="lg:col-span-2">
          <Card className="bg-dark-700 border-none shadow-xl overflow-hidden h-full">
            <div className="p-5 border-b border-dark-600 flex justify-between items-end">
              <div>
                <h2 className="text-base font-bold text-white mb-1">Today&apos;s payments</h2>
                <p className="text-xs text-dark-400">All channels combined</p>
              </div>
              <div className="text-sm text-dark-300">
                Total <span className="font-bold text-white ml-1">{formatCurrency(todayTotal)}</span>
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

        {/* Right Side: Overdue Dues Panel (Takes 1 col on large screens) */}
        <div className="lg:col-span-1">
          <OverdueDuesPanel />
        </div>

      </div>

      <RecordPaymentPanel 
        isOpen={isRecordPanelOpen} 
        onClose={() => setIsRecordPanelOpen(false)} 
      />
    </div>
  )
}