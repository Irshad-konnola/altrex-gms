// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";
import { sendTemplateMessage } from '@/lib/whatsapp/client'

// Initialize Supabase admin client using the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  console.log("🔥 WEBHOOK RECEIVED PING FROM RAZORPAY 🔥");
  try {
    const bodyText = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // 1. Verify the signature to ensure the request came from Razorpay
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(bodyText)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(bodyText);

    // 2. Handle the payment.captured event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const memberId = payment.notes.member_id;
      const planId = payment.notes.plan_id;
      const amountInRupees = payment.amount / 100;

      if (!memberId) {
        throw new Error("No member_id found in payment notes");
      }

      // Fetch the member's details
      const { data: member } = await supabaseAdmin
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();

      if (member) {
        const { data: plan, error: planError } = await supabaseAdmin
          .from("membership_plans")
          .select("id,name, duration_days")
          .eq("id", planId)
          .single();

        if (planError || !plan) {
          console.error(
            "⚠️ Could not fetch exact plan, using default 30 days",
            planError,
          );
        }

        // Calculate the exact end date based on the plan they bought
        const startDate = new Date();
        const endDate = addDays(startDate, plan?.duration_days || 30);

        // Create active membership with the CORRECT plan_id
        const { data: membership } = await supabaseAdmin
          .from("memberships")
          .insert([
            {
              member_id: memberId,
              plan_id: planId, // Use the real plan ID
              start_date: format(startDate, "yyyy-MM-dd"),
              end_date: format(endDate, "yyyy-MM-dd"),
              status: "active",
            },
          ])
          .select()
          .single();

        // Record the payment
        await supabaseAdmin.from("payments").insert([
          {
            member_id: memberId,
            membership_id: membership?.id,
            amount: amountInRupees,
            method: "razorpay",
            razorpay_payment_id: payment.id,
            status: "paid",
            receipt_sent: false,
          },
        ]);

        // Update member status
        await supabaseAdmin
          .from("members")
          .update({ status: "active" })
          .eq("id", memberId);

        if (member.phone) {
          try {
            await sendTemplateMessage({
              to: member.phone,
              templateName: 'payment_receipt', // The template name in Meta
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: member.full_name },
                    { type: 'text', text: amountInRupees.toString() },
                    { type: 'text', text: plan?.name || 'Your Plan' },
                    { type: 'text', text: format(endDate, 'dd MMM yyyy') }
                  ]
                }
              ]
            })
            console.log(`✅ WhatsApp receipt sent to ${member.full_name}`)
          } catch (waError) {
            console.error('⚠️ Could not send WhatsApp receipt:', waError)
            // We don't throw here because we don't want to fail the webhook just because WA failed
          }
        }      
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}