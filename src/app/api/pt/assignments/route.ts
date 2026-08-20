// src/app/api/pt/assignments/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addDays, format } from 'date-fns'
import { sendTemplateMessage } from '@/lib/whatsapp/client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    
    const body = await request.json()
    const { member_id, pt_package_id, trainer_name, start_date } = body

    if (!member_id || !pt_package_id || !trainer_name || !start_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Fetch the package details to get total sessions and validity days
    const { data: pkg, error: pkgError } = await db
      .from('pt_packages')
      .select('*')
      .eq('id', pt_package_id)
      .single()

    if (pkgError || !pkg) throw new Error("Package not found")

    // 🌟 NEW: Fetch member details for the WhatsApp message
    const { data: member, error: memberError } = await db
      .from('members')
      .select('full_name, phone')
      .eq('id', member_id)
      .single()
      
    if (memberError || !member) throw new Error("Member not found")

    // 2. Calculate end date
    const endDate = format(addDays(new Date(start_date), pkg.validity_days), 'yyyy-MM-dd')

    // 2.5 Ensure the member has an active common plan that covers this PT period
    const { data: memberships } = await db
      .from('memberships')
      .select('end_date')
      .eq('member_id', member_id)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      
    if (!memberships || memberships.length === 0) {
      throw new Error("Member must have an active regular plan to be assigned a PT package.")
    }
    
    if (new Date(endDate) > new Date(memberships[0].end_date)) {
      throw new Error(`The PT package validity (${endDate}) exceeds their regular plan validity (${memberships[0].end_date}). Please renew their regular plan first.`)
    }

    // 3. Create the assignment
    const { data: assignment, error: assignError } = await db
      .from('pt_assignments')
      .insert({
        member_id,
        pt_package_id,
        trainer_name,
        start_date,
        end_date: endDate,
        sessions_total: pkg.total_sessions,
        sessions_remaining: pkg.total_sessions,
        sessions_used: 0,
        status: 'active'
      })
      .select()
      .single()

    if (assignError) throw assignError

    // 4. Update the member to flag them as a PT member
    await db.from('members').update({ is_pt_member: true }).eq('id', member_id)

    // NEW: Log partial or full payment if provided
    const { amount_paid, payment_method } = body
    if (amount_paid && Number(amount_paid) > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      await db.from('payments').insert({
        member_id,
        amount: Number(amount_paid),
        method: payment_method || 'cash',
        status: 'paid',
        description: `PT Package: ${pkg.name}`,
        recorded_by: user?.id
      })
    }

    // 5. 🌟 WHATSAPP TRIGGER: PT Assigned
    if (member.phone) {
      try {
        await sendTemplateMessage({
          to: member.phone,
          templateName: "altrex_pt_assigned",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: member.full_name }, 
                { type: "text", text: trainer_name },    
                { type: "text", text: pkg.total_sessions.toString() }, 
              ],
            },
          ],
        });
        console.log(`✅ WhatsApp PT Assignment sent to ${member.phone}`);
      } catch (waError) {
        console.error("⚠️ WhatsApp PT Assignment Failed:", waError);
      }
    }

    return NextResponse.json(assignment)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}