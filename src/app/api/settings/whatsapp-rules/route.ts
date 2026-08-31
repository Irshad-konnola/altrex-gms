// src/app/api/settings/whatsapp-rules/route.ts
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Bypass strict typing until Database types are generated
    
    const db = supabase as any;

    const { data, error } = await db
      .from('gym_settings')
      .select('automation_rules')
      .limit(1)
      .single()
    
    // Define the new default rules matching your Meta templates
    const defaultRules = {
      altrex_renewal_7d: true,
      altrex_renewal_3d: true,
      altrex_renewal_today: true,
      altrex_inactivity_3d: false,
      altrex_inactivity_7d: true,
      altrex_welcome: true,
      payment_receipt: true,
      altrex_pt_assigned: true,
      altrex_pt_feedback: true,
      altrex_owner_daily_summary: true,
      altrex_birthday: false
    }

    if (error || !data?.automation_rules) {
      // Return defaults if not found
      return NextResponse.json(defaultRules)
    }
    
    // Merge existing rules with defaults so new keys are automatically picked up,
    // ignoring the old camelCase keys stored in the database.
    return NextResponse.json({ ...defaultRules, ...data.automation_rules })
  } catch  {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const rules = await request.json()

    // Bypass strict typing
    
    const db = supabase as any;

    // Get the first settings row ID
    const { data: gym } = await db.from('gym_settings').select('id').limit(1).single()
    
    if (gym) {
      await db.from('gym_settings').update({ automation_rules: rules }).eq('id', gym.id)
    }

    return NextResponse.json({ success: true })
  } catch  {
    return NextResponse.json({ error: 'Failed to update rules' }, { status: 500 })
  }
}
