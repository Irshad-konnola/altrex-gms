// src/app/api/cron/update-statuses/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Admin Client to bypass RLS in background jobs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Security Check: Only allow Vercel's Cron scheduler to run this
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Trigger the PostgreSQL function stored in your Supabase database
    const { error } = await supabaseAdmin.rpc('update_member_statuses')

    if (error) throw error

    console.log('✅ Daily member statuses updated successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Member statuses updated successfully' 
    })

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}