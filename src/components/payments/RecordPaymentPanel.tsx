// src/components/payments/RecordPaymentPanel.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox"
import {
  paymentSchema,
  PaymentFormValues,
} from "@/lib/validations/payment.schema";
import { Loader2, Send, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { RazorpayLinkModal } from "./RazorpayLinkModal";
// Import our real data hooks
import { useMembers } from "@/hooks/useMembers";
import { usePlans } from "@/hooks/usePlans";
import { usePaymentMutations } from "@/hooks/usePaymentMutations";

interface RecordPaymentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordPaymentPanel({
  isOpen,
  onClose,
}: RecordPaymentPanelProps) {
  // Fetch real data
  const { data: members, isLoading: isLoadingMembers } = useMembers();
  const { data: plans, isLoading: isLoadingPlans } = usePlans();
  const { recordPayment, generateRazorpayLink } = usePaymentMutations();
  const [modalData, setModalData] = useState<{
    url: string;
    phone?: string;
  } | null>(null);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      member_id: "",
      plan_id: "",
      amount: 0,
      method: "cash",
      reference_number: "",
      send_receipt: true,
    },
  });
// eslint-disable-next-line react-hooks/incompatible-library
  const selectedMethod = form.watch("method");

  const onSubmit = async (values: PaymentFormValues) => {
    if (values.method === "razorpay") {
      const selectedMember = members?.find((m) => m.id === values.member_id);
      const selectedPlan = plans?.find((p) => p.id === values.plan_id);

      generateRazorpayLink.mutate(
        {
          memberId: values.member_id,
          memberName: selectedMember?.full_name,
          memberPhone: selectedMember?.phone,
          amount: values.amount,
          planName: selectedPlan?.name,
          planId: values.plan_id,
        },
        {
          onSuccess: (shortUrl) => {
            // Close the side panel and open the QR modal
            onClose();
            setModalData({ url: shortUrl, phone: selectedMember?.phone });
            form.reset();
          },
        },
      );
      return;
    }

    // Cash/UPI logic remains exactly the same
    recordPayment.mutate(values, {
      onSuccess: () => {
        if (values.send_receipt) {
          toast.success("WhatsApp receipt queued");
        }
        form.reset();
        onClose();
      },
    });
  };
  // Helper to auto-fill the amount when a plan is selected
  const handlePlanSelect = (planId: string | null) => {
    // FIX: Add a safeguard to ignore null values
    if (!planId) return;

    form.setValue("plan_id", planId);
    const selectedPlan = plans?.find((p) => p.id === planId);
    if (selectedPlan) {
      form.setValue("amount", selectedPlan.price);
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              {/* REAL MEMBER LIST */}
              <FormField
                control={form.control}
                name="member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dark-300 uppercase text-xs tracking-wider font-semibold">
                      Select Member
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="bg-dark-900 border-dark-600 text-white focus:ring-gold-500 h-11"
                          disabled={isLoadingMembers}
                        >
                          <SelectValue
                            placeholder={
                              isLoadingMembers
                                ? "Loading members..."
                                : "Search members..."
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-dark-800 border-dark-600 text-white">
                        {members?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name}{" "}
                            {member.phone && `(${member.phone})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* REAL PLANS LIST */}
              <FormField
                control={form.control}
                name="plan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dark-300 uppercase text-xs tracking-wider font-semibold">
                      Membership Plan
                    </FormLabel>
                    <Select
                      onValueChange={handlePlanSelect}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="bg-dark-900 border-dark-600 text-white focus:ring-gold-500 h-11"
                          disabled={isLoadingPlans}
                        >
                          <SelectValue
                            placeholder={
                              isLoadingPlans
                                ? "Loading plans..."
                                : "Select a plan..."
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-dark-800 border-dark-600 text-white">
                        {plans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} (₹{plan.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dark-300 uppercase text-xs tracking-wider font-semibold">
                        Amount (₹)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-dark-900 border-dark-600 text-white focus:border-gold-500 font-medium text-lg h-11"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : 0,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dark-300 uppercase text-xs tracking-wider font-semibold">
                        Payment Method
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-dark-900 border-dark-600 text-white focus:ring-gold-500 h-11">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-dark-800 border-dark-600 text-white">
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="razorpay">
                            Razorpay Link
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              {selectedMethod === "upi" && (
                <FormField
                  control={form.control}
                  name="reference_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dark-300 uppercase text-xs tracking-wider font-semibold">
                        UTR / Reference Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter UPI reference"
                          className="bg-dark-900 border-dark-600 text-white focus:border-gold-500 h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="send_receipt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-dark-600/60 p-5 bg-dark-900/50 shadow-inner">
                  <div className="space-y-1">
                    <FormLabel className="text-base font-semibold text-white">
                      WhatsApp Receipt
                    </FormLabel>
                    <p className="text-xs text-dark-400">
                      Instantly send a payment confirmation to the member&apos;s
                      phone.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-gold-500 ml-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

<FormField
  control={form.control}
  name="send_receipt"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm border-dark-600 bg-dark-800">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
          className="data-[state=checked]:bg-gold-500 data-[state=checked]:text-dark-900 border-gold-500"
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel className="text-white">
          Send WhatsApp Receipt
        </FormLabel>
        <FormDescription className="text-dark-300">
          Automatically send payment confirmation to the member.
        </FormDescription>
      </div>
    </FormItem>
  )}
/>

            <div className="pt-8 flex justify-end gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-dark-300 hover:text-white px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting || recordPayment.isPending
                }
                className="bg-gold-500 text-dark-900 hover:bg-gold-600 font-bold px-8 shadow-lg shadow-gold-500/20"
              >
                {form.formState.isSubmitting || recordPayment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : selectedMethod === "razorpay" ? (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Payment Link
                  </>
                ) : (
                  "Confirm & Save"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
      <RazorpayLinkModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        paymentUrl={modalData?.url || ""}
        memberPhone={modalData?.phone}
      />
    </Sheet>
  );
}
