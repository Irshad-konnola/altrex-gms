"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { renewMembershipAction } from "@/app/(dashboard)/members/actions"
import { usePaymentMutations } from "@/hooks/usePaymentMutations"
import { RazorpayLinkModal } from "@/components/payments/RazorpayLinkModal"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function RenewPlanModal({ 
  memberId, 
  memberPhone, 
  memberName,
  currentEndDate
}: { 
  memberId: string, 
  memberPhone?: string, 
  memberName?: string,
  currentEndDate?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [planId, setPlanId] = useState("")
  const [startDate, setStartDate] = useState(currentEndDate && currentEndDate !== "No active plan" && new Date(currentEndDate) >= new Date() ? currentEndDate : new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [reference, setReference] = useState("")

  const { generateRazorpayLink } = usePaymentMutations()
  const [modalData, setModalData] = useState<{ url: string; phone?: string; memberId?: string } | null>(null)

  useEffect(() => {
    if (isOpen && plans.length === 0) {
      const fetchPlans = async () => {
        const supabase = createClient()
        const { data } = await supabase.from("membership_plans").select("*").order("price", { ascending: true })
        if (data) setPlans(data)
      }
      fetchPlans()
    }
  }, [isOpen, plans.length])

  const handlePlanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    setPlanId(selectedId)
    const selectedPlan = plans.find(p => p.id === selectedId)
    if (selectedPlan) setAmount(selectedPlan.price.toString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planId || !amount) return toast.error("Please fill all required fields")

    setIsSubmitting(true)
    const selectedPlan = plans.find(p => p.id === planId)

    try {
      if (paymentMethod === "razorpay") {
        generateRazorpayLink.mutate(
          {
            memberId: memberId,
            memberName: memberName,
            memberPhone: memberPhone,
            amount: Number(amount),
            planName: `Renewal: ${selectedPlan?.name}`,
            planId: planId,
            purpose: "renewal", // 🌟 TELLS WEBHOOK TO APPEND DATES
            startDate: startDate,
          },
          {
            onSuccess: (shortUrl) => {
              setIsOpen(false)
              setModalData({ url: shortUrl, phone: memberPhone, memberId: memberId })
              setPlanId("")
              setAmount("")
              setPaymentMethod("upi")
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onError: (err: any) => {
              toast.error(err.message || "Failed to generate link")
            }
          }
        )
        setIsSubmitting(false)
        return
      }

      // Standard Cash/UPI Action
      const result = await renewMembershipAction(memberId, { planId, amount, paymentMethod, reference, startDate })
      if (result.success) {
        toast.success("Plan renewed successfully!")
        setIsOpen(false)
      } else {
        toast.error(result.error)
      }
    } catch  {
      toast.error("Failed to renew plan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap h-10 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold w-full sm:w-auto rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-colors">
          <RefreshCw className="w-4 h-4 mr-2" />
          Renew Plan
        </DialogTrigger>
        
        <DialogContent className="bg-background border border-border text-foreground sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Renew Membership</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select New Plan</label>
              <select 
                value={planId}
                onChange={handlePlanSelect}
                className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:ring-2 focus:ring-gold-500/50"
                required
              >
                <option value="" disabled>Select a plan...</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ₹{p.price} ({p.duration_days} days)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Date</label>
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-card border-border text-foreground scheme-dark h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount Received (₹)</label>
              <Input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-card border-border text-gold-500 font-bold h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Payment Method</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="razorpay">Razorpay Link</option>
              </select>
            </div>

            {paymentMethod === "upi" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-foreground">UTR / Reference Number</label>
                <Input 
                  value={reference} 
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter UPI reference" 
                  className="bg-card border-border text-foreground h-11" 
                />
              </div>
            )}

            <Button type="submit" disabled={isSubmitting || generateRazorpayLink.isPending || !planId} className="w-full bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold rounded-xl mt-4 h-11">
              {isSubmitting || generateRazorpayLink.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : paymentMethod === "razorpay" ? (
                <><Send className="w-4 h-4 mr-2" /> Send Payment Link</>
              ) : (
                "Confirm Renewal"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <RazorpayLinkModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        paymentUrl={modalData?.url || ""}
        memberPhone={modalData?.phone}
        memberId={modalData?.memberId}
      />
    </>
  )
}