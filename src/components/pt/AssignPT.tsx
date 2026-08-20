// src/components/pt/AssignPT.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

type PTPackage = {
  id: string
  name: string
  total_sessions: number
  price: number
}

import { usePaymentMutations } from "@/hooks/usePaymentMutations";
import { RazorpayLinkModal } from "@/components/payments/RazorpayLinkModal";

export function AssignPT({ memberId, onAssigned }: { memberId: string, onAssigned?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [packages, setPackages] = useState<PTPackage[]>([])
  const [trainers, setTrainers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { generateRazorpayLink } = usePaymentMutations();
  const [modalData, setModalData] = useState<{ url: string; phone?: string; memberId?: string } | null>(null);

  const [formData, setFormData] = useState({
    pt_package_id: "",
    trainer_name: "",
    start_date: new Date().toISOString().split('T')[0],
    amount_paid: "",
    payment_method: "upi"
  })

  // Auto-fill amount_paid when package is selected
  useEffect(() => {
    if (formData.pt_package_id) {
      const selected = packages.find(p => p.id === formData.pt_package_id)
      if (selected) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(prev => ({ ...prev, amount_paid: selected.price.toString() }))
      }
    }
  }, [formData.pt_package_id, packages])

 useEffect(() => {
    const loadPackages = async () => {
      if (isOpen && packages.length === 0) {
        setLoading(true)
        try {
          const res = await fetch('/api/pt/packages')
          const data = await res.json()
          
          const activePackages = data.filter((p: any) => p.is_active)
          setPackages(activePackages)
          if (activePackages.length > 0) {
            setFormData(prev => ({ ...prev, pt_package_id: activePackages[0].id }))
          }
          
          // Fetch existing trainers
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: ptData } = await supabase.from('pt_assignments').select('trainer_name')
          if (ptData) {
            const uniqueTrainers = Array.from(new Set(ptData.map((pt: any) => pt.trainer_name).filter(Boolean))) as string[]
            setTrainers(uniqueTrainers)
          }
        } finally {
          setLoading(false)
        }
      }
    }
    
    loadPackages()
  }, [isOpen, packages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const selectedPkg = packages.find(p => p.id === formData.pt_package_id)

      if (formData.payment_method === "razorpay" && Number(formData.amount_paid) > 0) {
         // Generate Razorpay Link First
         const { createClient } = await import('@/lib/supabase/client')
         const supabase = createClient()
         const { data: member }: any = await supabase.from('members').select('full_name, phone').eq('id', memberId).single()
         
         generateRazorpayLink.mutate(
          {
            memberId: memberId,
            memberName: member?.full_name,
            memberPhone: member?.phone,
            amount: Number(formData.amount_paid) || (selectedPkg ? Number(selectedPkg.price) : 0),
            planName: `PT Package: ${selectedPkg?.name}`,
          },
          {
            onSuccess: async (shortUrl) => {
              // Now create the PT assignment but with 0 paid since razorpay is pending
              const assignRes = await fetch('/api/pt/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, amount_paid: 0, member_id: memberId })
              })
              
              if (!assignRes.ok) {
                const errorData = await assignRes.json()
                toast.error(errorData.error || "Failed to assign PT")
                setIsSubmitting(false)
                return
              }
              
              setIsOpen(false)
              setModalData({ url: shortUrl, phone: member?.phone, memberId: memberId })
              if (onAssigned) onAssigned()
              setIsSubmitting(false)
            },
            
            onError: (err: any) => {
              toast.error(err.message || "Failed to generate link");
              setIsSubmitting(false);
            }
          }
         )
         return;
      }

      const res = await fetch('/api/pt/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, member_id: memberId })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to assign PT")
      }

      toast.success("PT Package assigned successfully!")
      setIsOpen(false)
      if (onAssigned) onAssigned()
    } catch (err: any) {
      toast.error(err.message || "Error assigning PT package")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 shadow-md"
      >
        <Plus className="w-4 h-4" />
        Assign PT
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border/50 text-foreground sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Assign PT Package</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-gold-500 animate-spin" /></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Package *</label>
                <select 
                  required 
                  value={formData.pt_package_id}
                  onChange={e => setFormData({...formData, pt_package_id: e.target.value})}
                  className="w-full bg-card border border-border rounded-md p-2 text-foreground focus:border-gold-500 focus:outline-none"
                >
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.total_sessions} Sessions) - ₹{pkg.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Trainer Name *</label>
                <Input 
                  required 
                  list="trainer-list"
                  placeholder="e.g. Coach Ahmed" 
                  value={formData.trainer_name}
                  onChange={e => setFormData({...formData, trainer_name: e.target.value})}
                  className="bg-card border-border focus:border-gold-500 text-foreground" 
                />
                <datalist id="trainer-list">
                  {trainers.map((t, idx) => <option key={idx} value={t} />)}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Start Date *</label>
                <Input 
                  required 
                  type="date" 
                  value={formData.start_date}
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                  className="bg-card border-border focus:border-gold-500 text-foreground" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Amount Paid (Now)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 1000" 
                    value={formData.amount_paid}
                    onChange={e => setFormData({...formData, amount_paid: e.target.value})}
                    className="bg-card border-border focus:border-gold-500 text-foreground" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Payment Method</label>
                  <select 
                    value={formData.payment_method}
                    onChange={e => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full h-10 bg-card border border-border rounded-md px-3 text-foreground focus:border-gold-500 focus:outline-none"
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="razorpay">Razorpay Link</option>
                  </select>
                </div>
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold mt-4">
                {isSubmitting ? "Processing..." : formData.payment_method === "razorpay" ? "Generate Payment Link" : "Confirm Assignment"}
              </Button>
            </form>
          )}
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
