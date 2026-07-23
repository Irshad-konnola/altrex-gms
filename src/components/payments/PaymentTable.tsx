// src/components/payments/PaymentTable.tsx
import { PaymentWithDetails } from '@/hooks/usePayments'
import { formatCurrency } from '@/lib/utils/fromatCurrency'
import { format } from 'date-fns'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentTableProps {
  payments: PaymentWithDetails[]
}

export function PaymentTable({ payments }: PaymentTableProps) {
  const generateInitials = (name?: string) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="text-dark-300 text-xs uppercase tracking-wider border-b border-dark-600/50">
            <th className="pb-3 font-semibold px-4">Member</th>
            <th className="pb-3 font-semibold px-4">Plan</th>
            <th className="pb-3 font-semibold px-4">Method</th>
            <th className="pb-3 font-semibold px-4">Time</th>
            <th className="pb-3 font-semibold px-4">Amount</th>
            <th className="pb-3 font-semibold px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-600/30">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-dark-700/50 transition-colors">
              <td className="py-4 px-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-dark-600 flex items-center justify-center text-xs font-bold text-dark-200 shrink-0">
                  {generateInitials(payment.members?.full_name)}
                </div>
                <span className="font-medium text-white">{payment.members?.full_name || 'Unknown'}</span>
              </td>
              <td className="py-4 px-4 text-dark-200">
                {payment.memberships?.membership_plans?.name || 'N/A'}
              </td>
              <td className="py-4 px-4">
                <span className="bg-dark-600/50 text-dark-200 border border-dark-500 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md">
                  {payment.method}
                </span>
              </td>
              <td className="py-4 px-4 text-dark-300 text-xs">
                {format(new Date(payment.created_at), 'hh:mm a')}
              </td>
              <td className="py-4 px-4 font-medium text-white">
                {formatCurrency(payment.amount)}
              </td>
              <td className="py-4 px-4 text-right">
                <Button variant="ghost" size="sm" className="text-dark-300 hover:text-gold-400 hover:bg-gold-500/10 text-xs h-8">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Receipt
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}