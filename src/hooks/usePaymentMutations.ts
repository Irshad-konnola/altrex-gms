// src/hooks/usePaymentMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { PaymentFormValues } from "@/lib/validations/payment.schema";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

// Extend the schema type to include the UI-specific fields needed for WhatsApp
type ExtendedPaymentValues = PaymentFormValues & {
  send_receipt?: boolean;
  memberPhone?: string;
  memberName?: string;
  planName?: string;
};

export function usePaymentMutations() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Bypass strict typing until Supabase Database types are generated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const recordPayment = useMutation({
    mutationFn: async (values: ExtendedPaymentValues) => {
      const { data: plan, error: planError } = await db
        .from("membership_plans")
        .select("duration_days")
        .eq("id", values.plan_id)
        .single();
        
      if (planError || !plan) throw new Error("Failed to fetch plan details");
      
      const startDate = new Date();
      const endDate = addDays(startDate, plan.duration_days);
      
      const { data: membership, error: membershipError } = await db
        .from("memberships")
        .insert([
          {
            member_id: values.member_id,
            plan_id: values.plan_id,
            start_date: format(startDate, "yyyy-MM-dd"),
            end_date: format(endDate, "yyyy-MM-dd"),
            status: "active",
          },
        ])
        .select()
        .single();
        
      if (membershipError) throw membershipError;
      
      const { data: payment, error: paymentError } = await db
        .from("payments")
        .insert([
          {
            member_id: values.member_id,
            membership_id: membership.id,
            amount: values.amount,
            method: values.method,
            utr_reference: values.reference_number || null,
            status: "paid",
            receipt_sent: false,
          },
        ])
        .select()
        .single();
        
      if (paymentError) throw paymentError;
      
      const { error: memberError } = await db
        .from("members")
        .update({ status: "active" })
        .eq("id", values.member_id);
        
      if (memberError) throw memberError;

      // Send WhatsApp Receipt if requested
      if (values.send_receipt && values.memberPhone) {
        try {
          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: values.memberPhone,
              templateName: 'payment_receipt',
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: values.memberName || 'Member' },
                    { type: 'text', text: values.amount.toString() },
                    { type: 'text', text: values.planName || 'Gym Plan' },
                    { type: 'text', text: format(endDate, 'dd MMM yyyy') }
                  ]
                }
              ]
            })
          })
          console.log('WhatsApp receipt triggered')
        } catch (error) {
          console.error('Failed to trigger WhatsApp receipt:', error)
        }
      }

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Payment recorded and membership activated");
    },
    onError: (error) => {
      console.error("Payment mutation error:", error);
      toast.error("Failed to record payment. Check console for details.");
    },
  });

  const generateRazorpayLink = useMutation({
    mutationFn: async ({ memberId, memberName, memberPhone, amount, planName, planId }: { memberId: string, memberName?: string, memberPhone?: string, amount: number, planName?: string, planId?: string }) => {
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, memberName, memberPhone, amount, planName, planId }),
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        console.error('Raw server response:', text)
        throw new Error(`Server returned an invalid response (Status: ${response.status}). Check your API route path.`)
      }

      if (!response.ok) throw new Error(data.error || 'Failed to generate link')
      
      return data.shortUrl as string
    },
    onError: (error: Error) => {
      console.error('Link generation error:', error)
      toast.error(error.message || 'Failed to generate Razorpay link')
    }
  })

  return { recordPayment, generateRazorpayLink };
}