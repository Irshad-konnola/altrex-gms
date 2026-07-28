// src/app/api/settings/whatsapp-rules/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Bypass strict typing until Database types are generated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from('gym_settings')
      .select('automation_rules')
      .limit(1)
      .single()
    
    if (error || !data?.automation_rules) {
      // Return defaults if not found
      return NextResponse.json({
        renewal7d: true, renewal3d: true, renewalToday: true,
        inactivity3d: false, inactivity7d: true, paymentReceipt: true, ownerSummary: true
      })
    }
    
    return NextResponse.json(data.automation_rules)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const rules = await request.json()

    // Bypass strict typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Get the first settings row ID
    const { data: gym } = await db.from('gym_settings').select('id').limit(1).single()
    
    if (gym) {
      await db.from('gym_settings').update({ automation_rules: rules }).eq('id', gym.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rules' }, { status: 500 })
  }
}