/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendTemplateMessage } from "@/lib/whatsapp/client";

// 1. Fetch all members for the list page
export async function getMembers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select(
      `
      id,
      full_name,
      phone,
      status,
      is_pt_member,
      photo_url,   
      device_user_id,   
      memberships (
        end_date,
        status,
        membership_plans (
          name,
          duration_days
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching members:", error.message);
    return [];
  }

  return data.map((member: any) => {
    const sortedMemberships =
      member.memberships?.sort(
        (a: any, b: any) =>
          new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
      ) || [];

    const activeMembership = sortedMemberships[0];

    let daysLeft = 0;
    let planName = "Unknown Plan";

    if (activeMembership) {
      const endDate = new Date(activeMembership.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const planData = activeMembership.membership_plans;
      let basePlanName = "Unknown Plan";
      let planDuration = 30;

      if (Array.isArray(planData)) {
        basePlanName = planData[0]?.name || "Unknown Plan";
        planDuration = planData[0]?.duration_days || 30;
      } else if (planData?.name) {
        basePlanName = planData.name;
        planDuration = planData.duration_days || 30;
      }

      if (daysLeft > planDuration) {
        planName = `${basePlanName} (Renewed)`;
      } else {
        planName = basePlanName;
      }
    }

    return {
      id: member.id,
      full_name: member.full_name,
      phone: member.phone,
      status: member.status,
      is_pt_member: member.is_pt_member,
      photo_url: member.photo_url,
      device_user_id: member.device_user_id,
      plan_name: planName,
      days_left: daysLeft,
    };
  });
}

// 2. Add a new member & Send WhatsApp Welcome Note
export async function createMemberAction(formData: any) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Authentication session expired. Please log out and back in.",
    };
  }

  try {
    const { data: member, error: memberError }: any = await supabase
      .from("members")
      .insert({
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        health_notes: formData.health_notes || null,
        photo_url: formData.photoUrl || null,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
        status: "active",
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (memberError) throw new Error(`Member creation failed: ${memberError.message}`);

    const { data: planData, error: planError }: any = await supabase
      .from("membership_plans")
      .select("name, duration_days")
      .eq("id", formData.planId)
      .single();

    if (planError || !planData) throw new Error("Could not find the selected membership plan.");

    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planData.duration_days);

    const { error: membershipError }: any = await supabase
      .from("memberships")
      .insert({
        member_id: member.id,
        plan_id: formData.planId,
        start_date: formData.startDate,
        end_date: endDate.toISOString().split("T")[0],
        status: "active",
        created_by: user.id,
      } as any);

    if (membershipError) throw new Error(`Membership creation failed: ${membershipError.message}`);

    const { error: paymentError }: any = await supabase
      .from("payments")
      .insert({
        member_id: member.id,
        amount: parseFloat(formData.amount),
        method: formData.paymentMethod,
        utr_reference: formData.reference || null,
        status: "paid",
        description: `Plan: ${planData.name}`,
        recorded_by: user.id,
      } as any);

    if (paymentError) throw new Error(`Payment logging failed: ${paymentError.message}`);

    // 🌟 WHATSAPP TRIGGER: Send Welcome Note
    if (formData.phone) {
      try {
        await sendTemplateMessage({
          to: formData.phone,
          templateName: "altrex_welcome",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: formData.fullName || "Member" },
              ],
            },
          ],
        });
        console.log(`✅ WhatsApp Welcome message sent to ${formData.phone}`);
      } catch (waError) {
        console.error("⚠️ WhatsApp Welcome Message Failed:", waError);
        // We don't throw here to avoid failing member registration if WhatsApp API drops
      }
    }
    if (formData.phone) {
      try {
        await sendTemplateMessage({
          to: formData.phone,
          templateName: "payment_receipt",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: formData.fullName || "Member" },
                { type: "text", text: formData.amount.toString() },
                { type: "text", text: `Plan: ${planData.name}` },
                { type: "text", text: endDate.toISOString().split("T")[0] },
              ],
            },
          ],
        });
        console.log(`✅ WhatsApp Receipt sent to ${formData.phone}`);
      } catch (waError) {
        console.error("⚠️ WhatsApp Receipt Failed:", waError);
      }
    }

    revalidatePath("/members");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Fetch a single member by ID for the profile page
export async function getMemberById(id: string) {
  const supabase = await createClient();

  const { data: member, error }: any = await supabase
    .from("members")
    .select(
      `
      *,
      current_memberships:memberships (
        start_date,
        end_date,
        membership_plans (
          name
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !member) return null;

  const sortedMemberships =
    member.current_memberships?.sort(
      (a: any, b: any) =>
        new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    ) || [];

  const membership = sortedMemberships[0];

  let daysLeft = 0;
  let endDateStr = "No active plan";
  let startDateStr = "N/A";

  if (membership) {
    const endDate = new Date(membership.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    endDateStr = membership.end_date;
    startDateStr = membership.start_date;
  }

  return {
    id: member.id,
    full_name: member.full_name,
    phone: member.phone,
    email: member.email || "No email provided",
    gender: member.gender || "Not specified",
    dob: member.date_of_birth || "Not specified",
    address: member.address || "No address provided",
    health_notes: member.health_notes || "None",
    status: member.status,
    is_pt_member: member.is_pt_member,
    device_user_id: member.device_user_id,
    photo_url: member.photo_url,
    bmi: member.bmi,
    plan_name: membership?.membership_plans?.name || "No Plan",
    start_date: startDateStr,
    end_date: endDateStr,
    days_left: daysLeft,
    trainer_name: "Not Assigned",
    pt_sessions_left: 0,
  };
}

// 4. Update an existing member's profile
export async function updateMemberAction(memberId: string, formData: any) {
  const supabase = await createClient();

  try {
    const { error }: any = await (supabase.from("members") as any)
      .update({
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        date_of_birth: formData.dob || null,
        gender: formData.gender || null,
        address: formData.address || null,
        emergency_contact: formData.emergencyContact || null,
        health_notes: formData.healthNotes || null,
        device_user_id: formData.deviceUserId || null,
        photo_url: formData.photoUrl || null,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
      })
      .eq("id", memberId);

    if (error) throw new Error(`Profile update failed: ${error.message}`);

    revalidatePath("/members");
    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Archive (Soft Delete) a member
export async function archiveMemberAction(memberId: string) {
  const supabase = await createClient();

  try {
    const { error }: any = await (supabase.from("members") as any)
      .update({ status: "archived" })
      .eq("id", memberId);

    if (error) throw new Error(`Failed to archive member: ${error.message}`);

    revalidatePath("/members");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Extend a member's plan (Add days manually)
export async function extendMembershipAction(memberId: string, extraDays: number) {
  const supabase = await createClient();

  try {
    const { data: memberships, error: fetchError }: any = await supabase
      .from("memberships")
      .select("id, end_date")
      .eq("member_id", memberId)
      .order("end_date", { ascending: false })
      .limit(1);

    if (fetchError || !memberships || memberships.length === 0) {
      throw new Error("No active membership found to extend.");
    }

    const membership = memberships[0];

    const currentEnd = new Date(membership.end_date);
    currentEnd.setDate(currentEnd.getDate() + extraDays);
    const newEndDate = currentEnd.toISOString().split("T")[0];

    const { error: updateError }: any = await (supabase.from("memberships") as any)
      .update({ end_date: newEndDate })
      .eq("id", membership.id);

    if (updateError) throw new Error(`Failed to extend plan: ${updateError.message}`);

    revalidatePath("/members");
    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Renew a Membership (Append Date Logic & WhatsApp Receipt)
export async function renewMembershipAction(memberId: string, formData: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data: planData }: any = await supabase
      .from("membership_plans")
      .select("name, duration_days")
      .eq("id", formData.planId)
      .single();

    if (!planData) throw new Error("Plan not found");

    const { data: memberships }: any = await supabase
      .from("memberships")
      .select("id, end_date")
      .eq("member_id", memberId)
      .order("end_date", { ascending: false })
      .limit(1);

    const currentMem = memberships?.[0];

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (currentMem && new Date(currentMem.end_date) > startDate) {
      startDate = new Date(currentMem.end_date);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planData.duration_days);

    await (supabase.from("memberships") as any)
      .update({ status: "renewed" })
      .eq("member_id", memberId)
      .eq("status", "active");

    await (supabase.from("memberships") as any).insert({
      member_id: memberId,
      plan_id: formData.planId,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
      created_by: user?.id,
    });

    await (supabase.from("payments") as any).insert({
      member_id: memberId,
      amount: parseFloat(formData.amount),
      method: formData.paymentMethod,
      utr_reference: formData.reference || null,
      status: "paid",
      description: `Renewal: ${planData.name}`,
      recorded_by: user?.id,
    });

    // 🌟 WHATSAPP TRIGGER: Send Renewal Receipt
    try {
const { data: member }: any = await supabase
        .from("members")
        .select("full_name, phone")
        .eq("id", memberId)
        .single();

      if (member?.phone) {
        await sendTemplateMessage({
          to: member.phone,
          templateName: "payment_receipt",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: member.full_name },
                { type: "text", text: formData.amount.toString() },
                { type: "text", text: `Renewal: ${planData.name}` },
                { type: "text", text: endDate.toISOString().split("T")[0] },
              ],
            },
          ],
        });
      }
    } catch (waError) {
      console.error("⚠️ WhatsApp Renewal Receipt Error:", waError);
    }

    revalidatePath("/members");
    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Record a standalone Partial Payment & WhatsApp Receipt
export async function recordPaymentAction(memberId: string, formData: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { error }: any = await (supabase.from("payments") as any).insert({
      member_id: memberId,
      amount: parseFloat(formData.amount),
      method: formData.paymentMethod,
      utr_reference: formData.reference || null,
      status: "paid",
      description: formData.description || "Misc. Payment",
      recorded_by: user?.id,
    });

    if (error) throw error;

    // 🌟 WHATSAPP TRIGGER: Send Payment Receipt
    try {
const { data: member }: any = await supabase        .from("members")
        .select("full_name, phone")
        .eq("id", memberId)
        .single();

      if (member?.phone) {
        await sendTemplateMessage({
          to: member.phone,
          templateName: "payment_receipt",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: member.full_name },
                { type: "text", text: formData.amount.toString() },
                { type: "text", text: formData.description || "Gym Payment" },
                { type: "text", text: "N/A" },
              ],
            },
          ],
        });
      }
    } catch (waError) {
      console.error("⚠️ WhatsApp Payment Receipt Error:", waError);
    }

    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}