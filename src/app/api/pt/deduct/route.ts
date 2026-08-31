// src/app/api/pt/deduct/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const db = supabase as any
    
    const { assignment_id } = await request.json()

    if (!assignment_id) {
      return NextResponse.json({ error: 'Missing assignment ID' }, { status: 400 })
    }

    // 1. Fetch assignment and member details
    const { data: assignment, error: fetchError } = await db
      .from('pt_assignments')
      .select('sessions_remaining, sessions_used, member_id, trainer_name, members(full_name, phone)')
      .eq('id', assignment_id)
      .single()

    if (fetchError || !assignment) throw new Error("Assignment not found")
    if (assignment.sessions_remaining <= 0) {
      return NextResponse.json({ error: 'No sessions remaining!' }, { status: 400 })
    }

    // 2. Calculate new totals
    const newRemaining = assignment.sessions_remaining - 1
    const newUsed = assignment.sessions_used + 1
    const newStatus = newRemaining === 0 ? 'completed' : 'active'

    // 3. Update the database
    const { error: updateError } = await db
      .from('pt_assignments')
      .update({ sessions_remaining: newRemaining, sessions_used: newUsed, status: newStatus })
      .eq('id', assignment_id)

    if (updateError) throw updateError

    // 4. Trigger WhatsApp Feedback Prompt
    const memberName = assignment.members.full_name.split(' ')[0] // First name
    const promptText = `Hi ${memberName}, how was your PT session with ${assignment.trainer_name} today? 💪\n\nPlease reply with a number from 1 to 5 (1 = Poor, 5 = Excellent).`

    // Log it in the WhatsApp dashboard (In production, you'd call the Meta API here to actually send it)
    await db.from('whatsapp_logs').insert({
      member_id: assignment.member_id,
      message_type: 'pt_feedback_prompt',
      to_phone: assignment.members.phone,
      message_body: promptText,
      status: 'delivered' // Simulated
    })

    return NextResponse.json({ success: true, remaining: newRemaining, status: newStatus })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
