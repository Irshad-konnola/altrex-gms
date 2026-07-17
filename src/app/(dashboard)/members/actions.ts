/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
          name
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching members:", error.message);
    return [];
  }

  return data.map((member: any) => {
    console.log(data, "dataaa");

    // Find their active membership
    const activeMembership =
      member.memberships?.find(
        (m: any) => m.status === "active" || m.status === "expiring",
      ) || member.memberships?.[0];

    let daysLeft = 0;
    let planName = "Unknown Plan";

    if (activeMembership) {
      const endDate = new Date(activeMembership.end_date);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // BULLETPROOF EXTRACTION: Handle both Object and Array responses from Supabase
      const planData = activeMembership.membership_plans;
      if (Array.isArray(planData)) {
        planName = planData[0]?.name || "Unknown Plan";
      } else if (planData?.name) {
        planName = planData.name;
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
// 2. Add a new member
export async function createMemberAction(formData: any) {
  const supabase = await createClient();

  // Explicitly fetch the user first to verify the session exists on the server side
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth verification failed:", authError?.message);
    return {
      success: false,
      error: "Authentication session expired. Please log out and back in.",
    };
  }

  try {
    // Step 1: Insert into 'members' table
    const { data: member, error: memberError }: any = await supabase
      .from("members")
      .insert({
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        date_of_birth: formData.dob || null,
        gender: formData.gender || null,
        address: formData.address || null,
        emergency_contact: formData.emergencyContact || null,
        health_notes: formData.healthNotes || null,
        photo_url: formData.photoUrl || null,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
        status: "active",
        created_by: user.id,
      } as any)
      .select()
      .single();

    if (memberError) {
      console.error("DB Members Insert Error:", memberError);
      throw new Error(`Member creation failed: ${memberError.message}`);
    }

    // Step 2: Calculate end date based on plan
    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // Defaulting to 30 days for now

    // Step 3: Insert into 'memberships' table
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

    if (membershipError) {
      console.error("DB Memberships Insert Error:", membershipError);
      throw new Error(`Membership creation failed: ${membershipError.message}`);
    }

    // Step 4: Record the Payment
    const { error: paymentError }: any = await supabase
      .from("payments")
      .insert({
        member_id: member.id,
        amount: parseFloat(formData.amount),
        method: formData.paymentMethod,
        utr_reference: formData.reference || null,
        status: "paid",
        recorded_by: user.id,
      } as any);

    if (paymentError) {
      console.error("DB Payments Insert Error:", paymentError);
      throw new Error(`Payment logging failed: ${paymentError.message}`);
    }

    revalidatePath("/members");
    return { success: true };
  } catch (error: any) {
    console.error("Transaction Error caught in catch block:", error.message);
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
      current_memberships (
        start_date,
        end_date,
        membership_plans (
          name
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !member) {
    console.error("Error fetching member profile:", error?.message);
    return null;
  }

  // Format the data to match our UI components
  const membership = member.current_memberships?.[0];
  let daysLeft = 0;
  let endDateStr = "No active plan";
  let startDateStr = "N/A";

  if (membership) {
    const endDate = new Date(membership.end_date);
    const today = new Date();
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
    // PT Data will be wired up in Phase 7
    trainer_name: "Not Assigned",
    pt_sessions_left: 0,
  };
}
// 4. Update an existing member's profile
// 4. Update an existing member's profile
export async function updateMemberAction(memberId: string, formData: any) {
  const supabase = await createClient()

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
        photo_url: formData.photoUrl || null,                   // NEW
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,    // NEW
      })
      .eq("id", memberId)

    if (error) throw new Error(`Profile update failed: ${error.message}`)

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    
    return { success: true }
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 5. Archive (Soft Delete) a member
export async function archiveMemberAction(memberId: string) {
  const supabase = await createClient();

  try {
    // We update the status to 'archived' instead of deleting the row
    const { error }: any = await (supabase.from("members") as any)
      .update({ status: "archived" })
      .eq("id", memberId);

    if (error) {
      console.error("DB Archive Error:", error);
      throw new Error(`Failed to archive member: ${error.message}`);
    }

    // Refresh the members list so the archived member disappears from the active view
    revalidatePath("/members");

    return { success: true };
  } catch (error: any) {
    console.error("Archive Transaction Error:", error.message);
    return { success: false, error: error.message };
  }
}
