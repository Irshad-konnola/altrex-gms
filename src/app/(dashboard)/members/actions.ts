"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendTemplateMessage } from "@/lib/whatsapp/client";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Create Admin Client to bypass all RLS policies that might be incorrectly configured
const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// 1. Fetch all members for the list page
export async function getMembers() {
  const supabaseAuthClient = await createClient();
  const supabaseAdmin = getAdminClient();

  // Verify the user is authenticated first
  const { data: { user } } = await supabaseAuthClient.auth.getUser();
  if (!user) return [];

  // Use Admin Client to bypass RLS which is currently hiding memberships and plans
  const { data, error } = await supabaseAdmin
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
      split_timing,
      memberships (
        start_date,
        end_date,
        status,
        membership_plans (
          name,
          duration_days,
          price
        )
      ),
      pt_assignments (
        sessions_remaining,
        status,
        end_date
      ),
      payments (
        amount
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
    let computedStatus = member.status; // Default to db status

    if (activeMembership) {
      const startDate = new Date(activeMembership.start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(activeMembership.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

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

      if (startDate > today) {
        // Future Plan
        computedStatus = "upcoming";
        planName = basePlanName;
        // Time left for a future plan is just the plan's total duration
        daysLeft = planDuration; 
      } else {
        // Active or Expired Plan
        const diffTime = endDate.getTime() - today.getTime();
        daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        if (daysLeft > planDuration) {
          planName = `${basePlanName} (Renewed)`;
        } else {
          planName = basePlanName;
        }

        if (computedStatus !== "archived") {
           computedStatus = daysLeft > 0 ? "active" : "expired";
        }
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

    // Due amount calculation
    const totalBilled = member.memberships?.reduce((sum: number, m: any) => {
      const price = Array.isArray(m.membership_plans) ? m.membership_plans[0]?.price : m.membership_plans?.price;
      return sum + (Number(price) || 0);
    }, 0) || 0;
    
    const totalPaid = member.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
    const dueAmount = Math.max(0, totalBilled - totalPaid);

    return {
      id: member.id,
      full_name: member.full_name,
      phone: member.phone,
      status: computedStatus,
      is_pt_member: isPTMemberActive,
      photo_url: member.photo_url,
      device_user_id: member.device_user_id,
      days_left: daysLeft,
      pt_days_left: ptDaysLeft,
      pt_sessions_left: ptSessionsLeft,
      plan_name: planName,
      created_at: member.created_at,
      due_amount: dueAmount,
      split_timing: member.split_timing
    };
  });
}

// 2. Add a new member & Send WhatsApp Welcome Note
export async function createMemberAction(formData: any) {
  const supabaseAuthClient = await createClient();
  const supabaseAdmin = getAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabaseAuthClient.auth.getUser();

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
    const { data: existingMember } = await supabaseAdmin
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

    const { data: member, error: memberError }: any = await supabaseAdmin
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
        weight: formData.weight || null,
        height: formData.height || null,
        split_timing: formData.split_timing || false,
        status: initialStatus,
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (memberError) return { success: false, error: `Member Error: ${memberError.message}` };

    const { data: planData, error: planError }: any = await supabaseAdmin
      .from("membership_plans")
      .select("name, duration_days")
      .eq("id", formData.planId)
      .single();

    if (planError || !planData) return { success: false, error: "Could not find the selected plan." };

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planData.duration_days);

    const { error: membershipError }: any = await supabaseAdmin
      .from("memberships")
      .insert({
        member_id: member.id,
        plan_id: formData.planId,
        start_date: formData.startDate,
        end_date: endDate.toISOString().split("T")[0],
        status: initialStatus,
        created_by: user.id,
      } as any);

    if (membershipError) return { success: false, error: `Membership Error: ${membershipError.message}` };

    const { error: paymentError }: any = await supabaseAdmin
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

    if (paymentError) return { success: false, error: `Payment Error: ${paymentError.message}` };

    // WhatsApp logic...
    if (cleanPhone) {
      try {
        await sendTemplateMessage({
          to: cleanPhone,
          templateName: "altrex_welcome",
          components: [
            { type: "body", parameters: [{ type: "text", text: formData.fullName || "Member" }] },
          ],
        });
        console.log(`✅ WhatsApp Welcome message sent to ${cleanPhone}`);
      } catch (waError) {}
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
      } catch (waError) {}
    }

    revalidatePath("/members");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Fetch a single member by ID for the profile page
export async function getMemberById(id: string) {
  const supabaseAuthClient = await createClient();
  const supabaseAdmin = getAdminClient();

  const { data: { user } } = await supabaseAuthClient.auth.getUser();
  if (!user) return null;

  const { data: member, error }: any = await supabaseAdmin
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
    const startDate = new Date(membership.start_date);
    const endDate = new Date(membership.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    endDateStr = membership.end_date;
    startDateStr = membership.start_date;

    if (startDate > today) {
      const diffTime = endDate.getTime() - startDate.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else {
      const diffTime = endDate.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
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
    weight: member.weight,
    height: member.height,
    split_timing: member.split_timing,
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
  const supabaseAdmin = getAdminClient();

  try {
    let cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);
    cleanPhone = "91" + cleanPhone;

    const { data: existingMember } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("phone", cleanPhone)
      .neq("id", memberId)
      .single();
      
    if (existingMember) {
      return { success: false, error: "Another member with this phone number already exists." };
    }

    const { error }: any = await (supabaseAdmin.from("members") as any)
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
        weight: formData.weight || null,
        height: formData.height || null,
        split_timing: formData.split_timing || false,
      })
      .eq("id", memberId);

    if (error) throw new Error(`Profile update failed: ${error.message}`);

    // If plan was changed (EditMemberModal triggers this when planId is present)
    if (formData.planId) {
       const { data: planData, error: planError }: any = await supabaseAdmin
        .from("membership_plans")
        .select("duration_days")
        .eq("id", formData.planId)
        .single();
        
       if (!planError && planData) {
         // Get current active membership
         const { data: memberships }: any = await supabaseAdmin
          .from("memberships")
          .select("id, start_date")
          .eq("member_id", memberId)
          .order("end_date", { ascending: false })
          .limit(1);
          
         if (memberships && memberships.length > 0) {
            const startDate = new Date(memberships[0].start_date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + planData.duration_days);
            
            await supabaseAdmin.from("memberships")
              .update({ plan_id: formData.planId, end_date: endDate.toISOString().split("T")[0] })
              .eq("id", memberships[0].id);
         }
       }
    }

    revalidatePath("/members");
    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Archive (Soft Delete) a member
export async function archiveMemberAction(memberId: string) {
  const supabaseAdmin = getAdminClient();

  try {
    const { data: member } = await (supabaseAdmin as any)
      .from("members")
      .select("status")
      .eq("id", memberId)
      .single();
      
    if (member?.status === "active") {
      return { success: false, error: "Cannot archive an active member. Wait for their plan to expire or cancel it first." };
    }

    const { error }: any = await (supabaseAdmin.from("members") as any)
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
  const supabaseAdmin = getAdminClient();

  try {
    const { error }: any = await (supabaseAdmin.from("members") as any)
      .update({ status: "expired" }) 
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
  const supabaseAdmin = getAdminClient();

  try {
    const { data: memberships, error: fetchError }: any = await supabaseAdmin
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

    const { error: updateError }: any = await (supabaseAdmin.from("memberships") as any)
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
  const supabaseAuthClient = await createClient();
  const supabaseAdmin = getAdminClient();
  const { data: { user } } = await supabaseAuthClient.auth.getUser();

  try {
    const { data: planData }: any = await supabaseAdmin
      .from("membership_plans")
      .select("name, duration_days")
      .eq("id", formData.planId)
      .single();

    if (!planData) throw new Error("Plan not found");

    const { data: memberships }: any = await supabaseAdmin
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

    await (supabaseAdmin.from("memberships") as any)
      .update({ status: "renewed" })
      .eq("member_id", memberId)
      .eq("status", "active");

    await (supabaseAdmin.from("memberships") as any).insert({
      member_id: memberId,
      plan_id: formData.planId,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
    });
    
    await (supabaseAdmin.from("members") as any).update({ status: "active" }).eq("id", memberId);

    await (supabaseAdmin.from("payments") as any).insert({
      member_id: memberId,
      amount: parseFloat(formData.amount),
      method: formData.paymentMethod,
      utr_reference: formData.reference || null,
      status: "paid",
      description: `Renewal: ${planData.name}`,
    });

    try {
      const { data: member }: any = await supabaseAdmin
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
    } catch (waError) {}

    revalidatePath("/members");
    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Record a standalone Partial Payment & WhatsApp Receipt
export async function recordPaymentAction(memberId: string, formData: any) {
  const supabaseAdmin = getAdminClient();

  try {
    const { error }: any = await (supabaseAdmin.from("payments") as any).insert({
      member_id: memberId,
      amount: parseFloat(formData.amount),
      method: formData.paymentMethod,
      utr_reference: formData.reference || null,
      status: "paid",
      description: formData.description || "Misc. Payment",
    });

    if (error) throw error;

    try {
      const { data: member }: any = await supabaseAdmin        
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
                { type: "text", text: formData.description || "Gym Payment" },
                { type: "text", text: "N/A" },
              ],
            },
          ],
        });
      }
    } catch (waError) {}

    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Delete Member
export async function deleteMemberAction(memberId: string) {
  const supabaseAdmin = getAdminClient();

  try {
    // Delete dependent records first to avoid foreign key constraints
    await supabaseAdmin.from("payments").delete().eq("member_id", memberId);
    await supabaseAdmin.from("memberships").delete().eq("member_id", memberId);
    await supabaseAdmin.from("attendance").delete().eq("member_id", memberId);
    await supabaseAdmin.from("pt_assignments").delete().eq("member_id", memberId);

    const { error }: any = await (supabaseAdmin.from("members") as any)
      .delete()
      .eq("id", memberId);

    if (error) throw new Error(`Failed to delete member: ${error.message}`);

    revalidatePath("/members");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get specific member dues
export async function getMemberDuesAction(memberId: string) {
  const supabaseAdmin = getAdminClient();

  const { data: payData } = await supabaseAdmin.from('payments').select('amount').eq('member_id', memberId);
  const { data: memData } = await supabaseAdmin.from('memberships').select('membership_plans(price)').eq('member_id', memberId);
  const { data: ptData } = await supabaseAdmin.from('pt_assignments').select('pt_packages(price)').eq('member_id', memberId);

  let totalPaid = 0;
  payData?.forEach((p: any) => totalPaid += Number(p.amount));

  let totalBilled = 0;
  memData?.forEach((m: any) => {
    const price = Array.isArray(m.membership_plans) ? m.membership_plans[0]?.price : m.membership_plans?.price;
    totalBilled += Number(price || 0);
  });
  
  ptData?.forEach((m: any) => {
    const price = Array.isArray(m.pt_packages) ? m.pt_packages[0]?.price : m.pt_packages?.price;
    totalBilled += Number(price || 0);
  });

  return Math.max(0, totalBilled - totalPaid);
}
