"use server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function getAllPayments() {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from("payments")
    .select(`
      id, member_id, amount, method, status, payment_date, created_at, description,
      members:member_id (full_name, photo_url),
      memberships:membership_id (
        membership_plans:plan_id (name)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getMemberPaymentsData(memberId: string) {
  const supabase = getAdminClient()
  
  const { data: payData } = await supabase
    .from("payments")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    
  const { data: memData } = await supabase
    .from("memberships")
    .select("status, membership_plans(price)")
    .eq("member_id", memberId)

  const { data: ptData } = await supabase
    .from("pt_assignments")
    .select("pt_packages(price)")
    .eq("member_id", memberId)
    
  return { payData, memData, ptData }
}
