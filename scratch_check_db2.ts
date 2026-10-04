import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function testLogic() {
  const deviceUserId = '1'
  const eventData = { test: true }

  const { data: member, error: memberErr } = await supabaseAdmin
    .from('members')
    .select('id, full_name')
    .eq('device_user_id', deviceUserId)
    .single()

  console.log("Member Lookup:", member, memberErr)

  if (member) {
    const { data: insertData, error: insertErr } = await supabaseAdmin.from('attendance_logs').insert({
      member_id: member.id,
      check_in_at: new Date().toISOString(),
      method: 'FACE',
      device_raw: eventData
    }).select()
    console.log("Insert Result:", insertData, insertErr)
  }
}

testLogic()
