"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Receipt, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { RazorpayLinkModal } from "./RazorpayLinkModal";
import { useMembers } from "@/hooks/useMembers";
import { usePlans } from "@/hooks/usePlans";
import { recordPaymentAction } from "@/app/(dashboard)/members/actions";
import { createClient } from "@/lib/supabase/client";
import { usePaymentMutations } from "@/hooks/usePaymentMutations"; // 🌟 Re-added

interface RecordPaymentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordPaymentPanel({ isOpen, onClose }: RecordPaymentPanelProps) {
  const { data: members, isLoading: isLoadingMembers } = useMembers();
  const { data: plans, isLoading: isLoadingPlans } = usePlans();
  const { generateRazorpayLink } = usePaymentMutations(); // 🌟 Re-added
  const supabase = createClient();
  
const [modalData, setModalData] = useState<{ url: string; phone?: string; memberId?: string } | null>(null);  
  const [memberId, setMemberId] = useState("");
  const [memberDues, setMemberDues] = useState(0); 
  
  const [purpose, setPurpose] = useState("plan"); 
  const [planId, setPlanId] = useState("");
  const [customDescription, setCustomDescription] = useState("Cleared Pending Dues");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi");
  const [reference, setReference] = useState("");
  const [sendReceipt, setSendReceipt] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchMemberDues() {
      if (!memberId) {
        setMemberDues(0);
        return;
      }
      
      const { data: payData } = await supabase.from('payments').select('amount').eq('member_id', memberId);
      const { data: memData } = await supabase.from('memberships').select('membership_plans(price)').eq('member_id', memberId);

      let totalPaid = 0;
      // 🌟 FIXED TS ERROR: Explicitly typed 'p' as 'any' to bypass the 'never' array restriction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payData?.forEach((p: any) => totalPaid += Number(p.amount));

      let totalBilled = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      memData?.forEach((m: any) => {
        const price = Array.isArray(m.membership_plans) ? m.membership_plans[0]?.price : m.membership_plans?.price;
        totalBilled += Number(price || 0);
      });

      const pending = Math.max(0, totalBilled - totalPaid);
      setMemberDues(pending);

      if (purpose === "due") setAmount(pending.toString());
    }
    
    fetchMemberDues();
  }, [memberId, purpose, supabase]);

  const handlePlanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setPlanId(pId);
    const selectedPlan = plans?.find((p) => p.id === pId);
    if (selectedPlan) {
      setAmount(selectedPlan.price.toString());
    }
  };

  const handlePurposeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPurpose = e.target.value;
    setPurpose(newPurpose);
    
    if (newPurpose === "due") {
      setPlanId("");
      setAmount(memberDues.toString()); 
    } else {
      setAmount("");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return toast.error("Please select a member");
    if (purpose === "plan" && !planId) return toast.error("Please select a plan");
    if (!amount || Number(amount) <= 0) return toast.error("Please enter a valid amount");

    setIsSubmitting(true);

    try {
      // Determine exact description based on UI toggle
      let finalDescription = customDescription;
      if (purpose === "plan") {
        const selectedPlan = plans?.find((p) => p.id === planId);
        finalDescription = `Plan: ${selectedPlan?.name || "Unknown"}`;
      }

      // 🌟 RE-WIRED: Razorpay logic seamlessly integrated with new dynamic fields
      if (method === "razorpay") {
        const selectedMember = members?.find((m) => m.id === memberId);

        generateRazorpayLink.mutate(
          {
            memberId: memberId,
            memberName: selectedMember?.full_name,
            memberPhone: selectedMember?.phone,
            amount: Number(amount),
            planName: finalDescription, // Pass dynamic description so receipt looks right
            planId: purpose === "plan" ? planId : undefined,
          },
          {
            onSuccess: (shortUrl) => {
              onClose();
setModalData({ url: shortUrl, phone: selectedMember?.phone, memberId: memberId });              
              // Reset Form 
              setMemberId("");
              setPlanId("");
              setAmount("");
              setMethod("upi");
              setReference("");
              setPurpose("plan");
              setMemberDues(0);
              setIsSubmitting(false);
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onError: (err: any) => {
              toast.error(err.message || "Failed to generate link");
              setIsSubmitting(false);
            }
          },
        );
        return; 
      }

      // Standard Cash/Card/UPI Server Action Save
      const result = await recordPaymentAction(memberId, {
        amount,
        paymentMethod: method,
        reference,
        description: finalDescription
      });

      if (result.success) {
        if (sendReceipt) toast.success("WhatsApp receipt queued");
        toast.success("Payment recorded successfully!");
        
        setMemberId("");
        setPlanId("");
        setAmount("");
        setMethod("upi");
        setReference("");
        setPurpose("plan");
        setMemberDues(0);
        
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch  {
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="bg-dark-800 border-l border-dark-600 sm:max-w-lg w-full overflow-y-auto shadow-2xl">
        <SheetHeader className="mb-8 mt-2">
          <SheetTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-gold-500" />
            Record Payment
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-dark-300 uppercase text-xs tracking-wider font-semibold">Select Member *</label>
              <select 
                value={memberId} 
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 text-white focus:ring-2 focus:ring-gold-500 rounded-xl h-11 px-3"
                required
              >
                <option value="" disabled>{isLoadingMembers ? "Loading..." : "Search members..."}</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name} {m.phone && `(${m.phone})`}</option>
                ))}
              </select>
            </div>

            {memberDues > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">Attention: This member has pending dues of ₹{memberDues}.</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-dark-300 uppercase text-xs tracking-wider font-semibold">Payment Purpose</label>
              <select 
                value={purpose} 
                onChange={handlePurposeChange}
                className="w-full bg-dark-900 border border-dark-600 text-white focus:ring-2 focus:ring-gold-500 rounded-xl h-11 px-3"
              >
                <option value="plan">Buying a Membership Plan</option>
                <option value="due">Clearing Pending Dues / Custom Payment</option>
              </select>
            </div>

            {purpose === "plan" ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-dark-300 uppercase text-xs tracking-wider font-semibold">Select Plan *</label>
                <select 
                  value={planId} 
                  onChange={handlePlanSelect}
                  className="w-full bg-dark-900 border border-dark-600 text-white focus:ring-2 focus:ring-gold-500 rounded-xl h-11 px-3"
                  required
                >
                  <option value="" disabled>{isLoadingPlans ? "Loading..." : "Choose a plan..."}</option>
                  {plans?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-dark-300 uppercase text-xs tracking-wider font-semibold">Payment Description *</label>
                <Input 
                  value={customDescription} 
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="bg-dark-900 border-dark-600 text-white h-11 rounded-xl"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-dark-300 uppercase text-xs tracking-wider font-semibold">Amount (₹) *</label>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-dark-900 border-dark-600 text-white focus:border-gold-500 font-medium text-lg h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-dark-300 uppercase text-xs tracking-wider font-semibold">Payment Method</label>
                <select 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-600 text-white focus:ring-2 focus:ring-gold-500 rounded-xl h-11 px-3"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="razorpay">Razorpay Link</option>
                </select>
              </div>
            </div>

            {method === "upi" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-dark-300 uppercase text-xs tracking-wider font-semibold">UTR / Reference Number</label>
                <Input 
                  value={reference} 
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter UPI reference" 
                  className="bg-dark-900 border-dark-600 text-white focus:border-gold-500 h-11 rounded-xl" 
                />
              </div>
            )}
          </div>

          <div className="flex flex-row items-center justify-between rounded-xl border border-dark-600/60 p-5 bg-dark-900/50 shadow-inner">
            <div className="space-y-1">
              <label className="text-base font-semibold text-white">WhatsApp Receipt</label>
              <p className="text-xs text-dark-400">Instantly send a payment confirmation to the member.</p>
            </div>
            <Switch checked={sendReceipt} onCheckedChange={setSendReceipt} className="data-[state=checked]:bg-gold-500 ml-4" />
          </div>

          <div className="pt-8 flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={onClose} className="text-dark-300 hover:text-white px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || generateRazorpayLink.isPending} className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-bold px-8 shadow-[0_0_15px_rgba(234,179,8,0.2)] rounded-xl">
              {isSubmitting || generateRazorpayLink.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : method === "razorpay" ? (
                <><Send className="h-4 w-4 mr-2" />Send Payment Link</>
              ) : (
                "Confirm & Save"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
      
      <RazorpayLinkModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        paymentUrl={modalData?.url || ""}
        memberPhone={modalData?.phone}
        memberId={modalData?.memberId}
      />
    </Sheet>
  );
}