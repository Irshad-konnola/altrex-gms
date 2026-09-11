"use client"

import { useState, useEffect } from "react"
import { IndianRupee, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getMemberPaymentsData } from "@/app/(dashboard)/payments/actions"

export function MemberPaymentsTab({ memberId }: { memberId: string }) {
  
  const [payments, setPayments] = useState<any[]>([])
  const [lifetimeBilled, setLifetimeBilled] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { payData, memData, ptData } = await getMemberPaymentsData(memberId)
      
      if (payData) setPayments(payData)
      
      let totalCost = 0
      if (memData) {
        memData.forEach((m: any) => {
          const priceData = m.membership_plans
          if (Array.isArray(priceData)) {
            totalCost += Number(priceData[0]?.price || 0)
          } else if (priceData?.price) {
            totalCost += Number(priceData.price)
          }
        })
      }
      
      if (ptData) {
        ptData.forEach((pt: any) => {
          const priceData = pt.pt_packages
          if (Array.isArray(priceData)) {
            totalCost += Number(priceData[0]?.price || 0)
          } else if (priceData?.price) {
            totalCost += Number(priceData.price)
          }
        })
      }

      setLifetimeBilled(totalCost)
      setLoading(false)
    }

    fetchData()
  }, [memberId])

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const dueAmount = Math.max(0, lifetimeBilled - totalPaid)
  const isFullyPaid = dueAmount === 0

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Lifetime Billed</p>
          <p className="text-2xl font-bold text-foreground flex items-center"><IndianRupee className="w-5 h-5" /> {lifetimeBilled}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Amount Paid</p>
          <p className="text-2xl font-bold text-green-500 flex items-center"><IndianRupee className="w-5 h-5" /> {totalPaid}</p>
        </div>
        <div className={cn(
          "border rounded-xl p-5 relative overflow-hidden transition-colors shadow-sm",
          isFullyPaid ? "bg-card border-border" : "bg-red-500/10 border-red-500/30"
        )}>
          <p className={cn("text-sm font-medium mb-1", isFullyPaid ? "text-muted-foreground" : "text-red-400")}>Balance Due</p>
          <p className={cn("text-2xl font-bold flex items-center", isFullyPaid ? "text-foreground" : "text-red-500")}>
            <IndianRupee className="w-5 h-5" /> {dueAmount}
          </p>
        </div>
      </div>

      {!isFullyPaid && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-medium text-sm text-red-400">
            This member has pending dues of ₹{dueAmount}. Head to the central Payments module to clear this balance.
          </span>
        </div>
      )}

      <div className="bg-background border border-border rounded-xl overflow-x-auto no-scrollbar shadow-sm">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No payment history found.</div>
        ) : (
          <table className="w-full text-sm text-left min-w-[500px]">
            <thead className="text-xs text-muted-foreground uppercase bg-card border-b border-border">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-foreground">{p.description || "N/A"}</td>
                  <td className="px-6 py-4 font-bold text-green-500">₹{p.amount}</td>
                  <td className="px-6 py-4 text-foreground capitalize">{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
