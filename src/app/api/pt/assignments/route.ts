// src/app/api/pt/assignments/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addDays, format } from 'date-fns'

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

    // 2. Calculate end date
    const endDate = format(addDays(new Date(start_date), pkg.validity_days), 'yyyy-MM-dd')

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

    return NextResponse.json(assignment)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}