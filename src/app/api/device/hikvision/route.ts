// src/app/api/device/hikvision/route.ts
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Hikvision] CRITICAL ERROR: Missing Supabase Environment Variables on Netlify!')
    }

    const supabaseAdmin = createClient(supabaseUrl || '', supabaseKey || '')
    const contentType = request.headers.get('content-type') || ''
    
    // Read the raw text to avoid Next.js multipart parsing crashes with Hikvision's format
    const rawText = await request.text()
    
    let eventData: any = null
    let deviceSerial = 'HIKVISION_DEBUG'
    let deviceUserId = null

    try {
      if (contentType.includes('multipart/form-data')) {
        // Extract JSON using Regex to avoid strict boundary errors from Hikvision
        const match = rawText.match(/name="AccessControllerEvent"[\s\S]*?({[\s\S]*?})\s*--/i)
        if (match && match[1]) {
           eventData = JSON.parse(match[1])
        } else {
           // Fallback regex
           const fallbackMatch = rawText.match(/({[\s\S]*"ipAddress"[\s\S]*})/i)
           if (fallbackMatch && fallbackMatch[1]) {
             eventData = JSON.parse(fallbackMatch[1])
           } else {
             eventData = { raw_payload: rawText.substring(0, 1000) } // Save some for debug
           }
        }
      } else if (contentType.includes('application/json')) {
        eventData = JSON.parse(rawText)
      } else {
        eventData = { raw_payload: rawText.substring(0, 1000) }
      }
    } catch (parseError) {
      console.error('[Hikvision] Parse Error:', parseError)
      eventData = { raw_payload: rawText.substring(0, 1000), error: 'Parse Failed' }
    }

    // Sometimes Hikvision nests it
    if (eventData && eventData.AccessControllerEvent) {
      eventData = eventData.AccessControllerEvent
    }

    if (eventData) {
       // Extract user ID and Serial based on standard Hikvision JSON schema
       deviceUserId = eventData.employeeNoString || eventData.employeeNo || null
       deviceSerial = eventData.serialNo || eventData.macAddress || 'HIKVISION_DEBUG'
    }

    // 1. Log the raw event for debugging
    await supabaseAdmin.from('device_events').insert({
      device_serial: deviceSerial,
      raw_payload: eventData,
      device_user_id: deviceUserId,
      event_type: 'HIKVISION_ATTLOG',
    })

    // 2. Process actual check-in if user is found and it's an attendance event
    // Hikvision usually sends subType for various events. We check if they have an ID.
    if (deviceUserId) {
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id, full_name')
        .eq('device_user_id', deviceUserId)
        .single()

      if (member) {
        // Log attendance (avoiding duplicate logs logic can be added later, keep it simple for now)
        await supabaseAdmin.from('attendance_logs').insert({
          member_id: member.id,
          check_in_at: new Date().toISOString(),
          method: 'face',
          device_raw: eventData
        })
        console.log(`[Hikvision] ✅ ${member.full_name} checked in!`)
      } else {
        console.warn(`[Hikvision] ⚠️ Unknown face ID scanned: ${deviceUserId}`)
      }
    }

    // 3. REQUIRED HIKVISION RESPONSE
    // Echo the exact URL path requested
    const urlPath = new URL(request.url).pathname
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?><ResponseStatus version="2.0" xmlns="http://www.hikvision.com/ver20/XMLSchema"><requestURL>${urlPath}</requestURL><statusCode>1</statusCode><statusString>OK</statusString></ResponseStatus>`

    return new Response(xmlResponse, { 
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Connection': 'close'
      }
    })

  } catch (error: unknown) {
    console.error('[Hikvision] Webhook Error:', error)
    // Always return the XML OK so the machine doesn't get stuck in a retry loop
    const urlPath = new URL(request.url).pathname
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?><ResponseStatus version="2.0" xmlns="http://www.hikvision.com/ver20/XMLSchema"><requestURL>${urlPath}</requestURL><statusCode>1</statusCode><statusString>OK</statusString></ResponseStatus>`
    return new Response(xmlResponse, { 
        status: 200, 
        headers: { 'Content-Type': 'application/xml', 'Connection': 'close' } 
    })
  }
}
