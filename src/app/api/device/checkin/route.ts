// src/app/api/device/checkin/route.ts
import { createClient } from '@supabase/supabase-js'
import { parseESSLPayload } from '@/lib/essl/parser'

// Initialize Admin Client to bypass RLS for hardware requests
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // 1. Read raw text from the device (eSSL sends URL-encoded form data)
    const rawText = await request.text()
    const params = new URLSearchParams(rawText)
    
    const sn = params.get('SN')
    const data = params.get('DATA')

    if (!sn || !data) {
      return new Response('Missing SN or DATA', { status: 400 })
    }

    // 2. Parse the payload
    const parsed = parseESSLPayload({ SN: sn, DATA: data })

    // 3. Log the raw event for debugging (always log, even if it fails later)
    await supabaseAdmin.from('device_events').insert({
      device_serial: parsed.deviceSerial,
      raw_payload: Object.fromEntries(params),
      device_user_id: parsed.deviceUserId,
      event_type: 'ATTLOG',
    })

    // 4. Find the member by their device Face ID
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('id, full_name, status, is_pt_member')
      .eq('device_user_id', parsed.deviceUserId)
      .single()

    if (memberError || !member) {
      console.warn(`[eSSL] Unknown face scanned. Device ID: ${parsed.deviceUserId}`)
      // We MUST return 200 OK so the machine clears the log and doesn't get stuck in a retry loop
      return new Response('OK', { status: 200 })
    }

    // 5. Log the successful check-in
    const { error: attendanceError } = await supabaseAdmin
      .from('attendance_logs')
      .insert({
        member_id: member.id,
        check_in_at: parsed.datetime.toISOString(),
        method: parsed.method,
        device_raw: Object.fromEntries(params),
      })

    if (attendanceError) throw attendanceError

    console.log(`[eSSL] ✅ ${member.full_name} checked in via ${parsed.method}`)

    // (PT Session Deduction logic will plug in here later)

    // 6. Return OK to the machine
    return new Response('OK', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })

  } catch (error: unknown) {
    console.error('eSSL Webhook Error:', error)
    // The device expects a plain text "OK" even on errors to prevent sync blocking
    return new Response('OK', { status: 200 })
  }
}