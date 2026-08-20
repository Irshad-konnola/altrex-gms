// src/app/api/pt/active/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const db = supabase as any

    // Fetch all active assignments, joining with members and pt_packages tables
    const { data, error } = await db
      .from('pt_assignments')
      .select(`
        id,
        trainer_name,
        sessions_total,
        sessions_remaining,
        sessions_used,
        end_date,
        members ( id, full_name, phone, photo_url ),
        pt_packages ( name )
      `)
      .eq('status', 'active')
      .order('sessions_remaining', { ascending: true }) // Show people running out of sessions first

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
