// src/app/api/device/hikvision/route.ts
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const urlPath = new URL(request.url).pathname
  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?><ResponseStatus version="2.0" xmlns="http://www.hikvision.com/ver20/XMLSchema"><requestURL>${urlPath}</requestURL><statusCode>1</statusCode><statusString>OK</statusString></ResponseStatus>`

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Hikvision] CRITICAL ERROR: Missing Supabase Environment Variables on Netlify!')
    }

    const contentType = request.headers.get('content-type') || ''
    const rawText = await request.text()
    
    let eventData: any = null
    let deviceUserId = null

    try {
      if (contentType.includes('multipart/form-data')) {
        const match = rawText.match(/name="AccessControllerEvent"[\s\S]*?({[\s\S]*?})\s*--/i)
        if (match && match[1]) {
           eventData = JSON.parse(match[1])
        } else {
           const fallbackMatch = rawText.match(/({[\s\S]*"ipAddress"[\s\S]*})/i)
           if (fallbackMatch && fallbackMatch[1]) {
             eventData = JSON.parse(fallbackMatch[1])
           } else {
             eventData = { raw_payload: rawText.substring(0, 1000) }
           }
        }
      } else if (contentType.includes('application/json')) {
        eventData = JSON.parse(rawText)
      } else {
        eventData = { raw_payload: rawText.substring(0, 1000) }
      }
    } catch {
      eventData = { raw_payload: rawText.substring(0, 1000), error: 'Parse Failed' }
    }

    if (eventData && eventData.AccessControllerEvent) {
      eventData = eventData.AccessControllerEvent
    }

    if (eventData) {
       deviceUserId = eventData.employeeNoString || eventData.employeeNo || null
    }

    // FAST-PATH OPTIMIZATION:
    // If it's a heartbeat, keep-alive, or non-user event, respond immediately in < 2ms!
    // This avoids database roundtrips for 98% of camera events, saving Netlify compute credits.
    if (!deviceUserId || eventData?.eventType === 'heartBeat' || eventData?.eventDescription === 'heartBeat') {
      return new Response(xmlResponse, { 
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Connection': 'close'
        }
      })
    }

    // Process actual member face check-in
    const supabaseAdmin = createClient(supabaseUrl || '', supabaseKey || '')
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id, full_name')
      .eq('device_user_id', deviceUserId)
      .single()

    if (member) {
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

    return new Response(xmlResponse, { 
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Connection': 'close'
      }
    })

  } catch (error: unknown) {
    console.error('[Hikvision] Webhook Error:', error)
    return new Response(xmlResponse, { 
        status: 200, 
        headers: { 'Content-Type': 'application/xml', 'Connection': 'close' } 
    })
  }
}
