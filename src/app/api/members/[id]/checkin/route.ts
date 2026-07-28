// src/app/api/members/[id]/checkin/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use Admin Client to bypass RLS for inserting the log
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: Request,
  // Next.js 15 requires awaiting params in dynamic routes
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const memberId = resolvedParams.id

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Insert the attendance log with method = 'manual'
    const { error } = await supabaseAdmin
      .from('attendance_logs')
      .insert({
        member_id: memberId,
        check_in_at: new Date().toISOString(),
        method: 'manual', // Tags it specifically as a manual entry
      })

    if (error) throw error

    return NextResponse.json({ success: true })
    
  } catch (error: unknown) {
    console.error('Manual Check-in Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}