// src/app/api/whatsapp/logs/route.ts
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Bypass strict typing until Database types are generated
    
    const db = supabase as any;

    // Fetch the recent 50 messages, joining with the members table to get the name
    const { data, error } = await db
      .from('whatsapp_logs')
      .select(`
        id, 
        message_type, 
        to_phone, 
        status, 
        sent_at,
        members (full_name)
      `)
      .order('sent_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error("Supabase Log Error:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Failed to fetch WhatsApp logs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
