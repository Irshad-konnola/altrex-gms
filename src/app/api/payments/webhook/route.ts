import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";
import { sendTemplateMessage } from '@/lib/whatsapp/client'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  console.log("🔥 WEBHOOK RECEIVED PING FROM RAZORPAY 🔥");
  try {
    const bodyText = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(bodyText)
      .digest("hex");

    if (expectedSignature !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const event = JSON.parse(bodyText);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const notes = payment.notes || {};
      
      const memberId = notes.member_id;
      const planId = notes.plan_id;
      const description = notes.description || notes.plan_name || 'Razorpay Payment';
      const purpose = notes.purpose || 'new_registration'; // 🌟 The Traffic Cop
      const amountInRupees = payment.amount / 100;

      if (!memberId) throw new Error("No member_id found in payment notes");

      const { data: member } = await supabaseAdmin.from("members").select("*").eq("id", memberId).single();

      if (member) {
        let membershipId = null;
        let finalEndDate = new Date();
        let planNameStr = "Custom Payment";

        // 🌟 SCENARIO A: Membership logic (New or Renewal)
        if (purpose === 'new_registration' || purpose === 'renewal') {
          const { data: plan } = await supabaseAdmin
            .from("membership_plans")
            .select("id, name, duration_days")
            .eq("id", planId)
            .single();

          if (plan) {
            planNameStr = plan.name;
            let startDate = new Date();
            startDate.setHours(0, 0, 0, 0);

            // 🌟 THE RENEWAL LOGIC: Check for active plan to append dates
            if (purpose === 'renewal') {
              const { data: activeMems } = await supabaseAdmin
                .from("memberships")
                .select("id, end_date")
                .eq("member_id", memberId)
                .eq("status", "active")
                .order("end_date", { ascending: false })
                .limit(1);

              const currentMem = activeMems?.[0];
              if (notes.start_date) {
                startDate = new Date(notes.start_date);
              } else if (currentMem && new Date(currentMem.end_date) > startDate) {
                startDate = new Date(currentMem.end_date);
              }

              // Archive old active plans
              await supabaseAdmin.from("memberships").update({ status: "renewed" })
                .eq("member_id", memberId).eq("status", "active");
            }

            finalEndDate = addDays(startDate, plan.duration_days);

            const { data: membership } = await supabaseAdmin
              .from("memberships")
              .insert([{
                member_id: memberId,
                plan_id: planId,
                start_date: format(startDate, "yyyy-MM-dd"),
                end_date: format(finalEndDate, "yyyy-MM-dd"),
                status: "active",
              }])
              .select()
              .single();

            membershipId = membership?.id;
            
            await supabaseAdmin.from("members").update({ status: "active" }).eq("id", memberId);
          }
        }

        // 🌟 ALL SCENARIOS: Record the actual payment
        await supabaseAdmin.from("payments").insert([{
          member_id: memberId,
          membership_id: membershipId, 
          amount: amountInRupees,
          method: "razorpay",
          razorpay_payment_id: payment.id,
          utr_reference: payment.id,
          status: "paid",
          receipt_sent: false,
          description: description,
        }]);

        // WhatsApp Receipt
        if (member.phone) {
          try {
            await sendTemplateMessage({
              to: member.phone,
              templateName: 'payment_receipt',
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: member.full_name },
                  { type: 'text', text: amountInRupees.toString() },
                  { type: 'text', text: planNameStr },
                  { type: 'text', text: purpose !== 'clear_dues' ? format(finalEndDate, 'dd MMM yyyy') : 'N/A' }
                ]
              }]
            });
          } catch (waError) {
            console.error('⚠️ Could not send WhatsApp receipt:', waError);
          }
        }      
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}