// src/app/api/device/hikvision/route.ts
import { createClient } from '@supabase/supabase-js'

// Initialize Admin Client to bypass RLS for hardware requests
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    console.log(`[Hikvision] Received Webhook with Content-Type: ${contentType}`)

    let eventData: any = null

    // Hikvision often sends multipart/form-data containing JSON or XML
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      // Log all form data keys for debugging
      const keys = Array.from(formData.keys())
      console.log(`[Hikvision] Multipart Form Keys:`, keys)
      
      // Usually, the event info is in a field called 'event_log' or 'event_info'
      for (const key of keys) {
        const value = formData.get(key)
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('<'))) {
          console.log(`[Hikvision] Found data in key "${key}":`, value.substring(0, 200) + '...')
          try {
            eventData = JSON.parse(value)
          } catch (e) {
            // Might be XML, we will just save the raw string for now
            eventData = { raw_xml: value }
          }
        }
      }
      
      if (!eventData) {
        // If we couldn't find a JSON/XML string, just save all text fields
        eventData = {}
        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string') {
            eventData[key] = value
          }
        }
      }
    } else if (contentType.includes('application/json')) {
      eventData = await request.json()
      console.log(`[Hikvision] JSON Payload:`, JSON.stringify(eventData).substring(0, 200) + '...')
    } else {
      // Fallback for raw text/xml
      const text = await request.text()
      console.log(`[Hikvision] Raw Text Payload:`, text.substring(0, 200) + '...')
      eventData = { raw_payload: text }
    }

    // 1. Log the raw event for debugging
    await supabaseAdmin.from('device_events').insert({
      device_serial: 'HIKVISION_DEBUG', // We will extract the real serial later
      raw_payload: eventData,
      event_type: 'HIKVISION_ATTLOG',
    })

    // NOTE: In the next step, once we see the exact format in Supabase 'device_events',
    // we will write the logic to extract the 'device_user_id', check 'members', and insert into 'attendance_logs'.

    // 2. Return 200 OK immediately.
    // Hikvision devices REQUIRE a 200 OK response, otherwise they will retry continuously.
    return new Response('OK', { status: 200 })

  } catch (error: unknown) {
    console.error('[Hikvision] Webhook Error:', error)
    // Always return 200 OK so the machine doesn't get stuck in a retry loop
    return new Response('OK', { status: 200 })
  }
}
