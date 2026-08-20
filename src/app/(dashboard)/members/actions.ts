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
      created_at,   
      memberships (
        end_date,
        status,
        membership_plans (
          name,
          duration_days
        )
      ),
      pt_assignments (
        sessions_remaining,
        status,
        end_date
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

    let ptDaysLeft = null;
    let ptSessionsLeft = null;
    
    let isPTMemberActive = member.is_pt_member;
    if (isPTMemberActive && member.pt_assignments && Array.isArray(member.pt_assignments)) {
      const activePT = member.pt_assignments.find((pt: any) => pt.status === 'active');
      if (activePT) {
        ptSessionsLeft = activePT.sessions_remaining;
        if (activePT.end_date) {
          const ptEndDate = new Date(activePT.end_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          ptEndDate.setHours(0, 0, 0, 0);
          ptDaysLeft = Math.max(0, Math.ceil((ptEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        }
      } else {
        isPTMemberActive = false; // They don't have an ACTIVE pt_assignment
      }
    }

    return {
      id: member.id,
      full_name: member.full_name,
      phone: member.phone,
      status: member.status,
      is_pt_member: isPTMemberActive,
      photo_url: member.photo_url,
      device_user_id: member.device_user_id,
      days_left: daysLeft,
      pt_days_left: ptDaysLeft,
      pt_sessions_left: ptSessionsLeft,
      plan_name: planName,
      created_at: member.created_at,
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
    let cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }
    cleanPhone = "91" + cleanPhone; // Always ensure it starts with 91 and has 12 digits total
    
    // Check for duplicate phone number
    const { data: existingMember } = await supabase
      .from("members")
      .select("id")
      .eq("phone", cleanPhone)
      .single();
      
    if (existingMember) {
      return { success: false, error: "A member with this phone number already exists." };
    }

    // Determine initial status based on start date
    const startDate = new Date(formData.startDate);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const initialStatus = startDate > today ? "upcoming" : "active";

    const { data: member, error: memberError }: any = await supabase
      .from("members")
      .insert({
        full_name: formData.fullName,
        phone: cleanPhone,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        health_notes: formData.health_notes || null,
        photo_url: formData.photoUrl || null,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
        status: initialStatus,
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

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planData.duration_days);

    const { error: membershipError }: any = await supabase
      .from("memberships")
      .insert({
        member_id: member.id,
        plan_id: formData.planId,
        start_date: formData.startDate,
        end_date: endDate.toISOString().split("T")[0],
        status: initialStatus,
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
    if (cleanPhone) {
      try {
        await sendTemplateMessage({
          to: cleanPhone,
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
        console.log(`✅ WhatsApp Welcome message sent to ${cleanPhone}`);
      } catch (waError) {
        console.error("⚠️ WhatsApp Welcome Message Failed:", waError);
        // We don't throw here to avoid failing member registration if WhatsApp API drops
      }
    }
    if (cleanPhone) {
      try {
        await sendTemplateMessage({
          to: cleanPhone,
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
        console.log(`✅ WhatsApp Receipt sent to ${cleanPhone}`);
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
    let cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }
    cleanPhone = "91" + cleanPhone;

    // Check for duplicate phone number
    const { data: existingMember } = await supabase
      .from("members")
      .select("id")
      .eq("phone", cleanPhone)
      .neq("id", memberId)
      .single();
      
    if (existingMember) {
      return { success: false, error: "Another member with this phone number already exists." };
    }

    const { error }: any = await (supabase.from("members") as any)
      .update({
        full_name: formData.fullName,
        phone: cleanPhone,
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
    // Check if member is active
    const { data: member } = await (supabase as any)
      .from("members")
      .select("status")
      .eq("id", memberId)
      .single();
      
    if (member?.status === "active") {
      return { success: false, error: "Cannot archive an active member. Wait for their plan to expire or cancel it first." };
    }

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

// 5.5. Unarchive a member
export async function unarchiveMemberAction(memberId: string) {
  const supabase = await createClient();

  try {
    const { error }: any = await (supabase.from("members") as any)
      .update({ status: "expired" }) // Default to expired, if they had an active plan it will be recalculated on next login/cron
      .eq("id", memberId);

    if (error) throw new Error(`Failed to unarchive member: ${error.message}`);

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

    if (formData.startDate) {
      startDate = new Date(formData.startDate);
      startDate.setHours(0, 0, 0, 0);
    } else if (currentMem && new Date(currentMem.end_date) > startDate) {
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
    
    // Fix: Set member status back to active
    await (supabase.from("members") as any).update({ status: "active" }).eq("id", memberId);

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