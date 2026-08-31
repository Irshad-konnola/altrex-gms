import { PaymentWithDetails } from '@/hooks/usePayments'
import { formatCurrency } from '@/lib/utils/fromatCurrency'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { generatePaymentReceipt } from '@/lib/utils/pdfGenerator'

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
          <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border/50">
            <th className="pb-3 font-semibold px-4">Member</th>
            <th className="pb-3 font-semibold px-4">Description</th>
            <th className="pb-3 font-semibold px-4">Method</th>
            <th className="pb-3 font-semibold px-4">Time</th>
            <th className="pb-3 font-semibold px-4">Amount</th>
            <th className="pb-3 font-semibold px-4 text-right">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-card/50 transition-colors group">
              <td className="py-4 px-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                  {generateInitials(payment.members?.full_name)}
                </div>
                <span className="font-medium text-foreground">{payment.members?.full_name || 'Unknown'}</span>
              </td>
              <td className="py-4 px-4 text-foreground">
                {payment.description || 'N/A'}
              </td>
              <td className="py-4 px-4">
                <span className="bg-muted/50 text-foreground border border-border text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md">
                  {payment.method}
                </span>
              </td>
              <td className="py-4 px-4 text-muted-foreground text-xs">
                {format(new Date(payment.created_at), 'hh:mm a')}
              </td>
              <td className="py-4 px-4 font-medium text-foreground">
                {formatCurrency(payment.amount)}
              </td>
              <td className="py-4 px-4 text-right">
                <button
                  onClick={() => generatePaymentReceipt(payment)}
                  className="p-2 text-muted-foreground hover:text-gold-500 bg-card hover:bg-muted rounded-lg transition-all border border-transparent hover:border-border"
                  title="Download Receipt"
                >
                  <Download className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}