import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkEvents() {
  const { data, error } = await supabaseAdmin.from('device_events').select('*').order('received_at', { ascending: false }).limit(200)
  if (error) return console.error(error)
  const found = data.filter(r => JSON.stringify(r.raw_payload).includes('employeeNo') || JSON.stringify(r.raw_payload).includes('arif'));
  console.log('Found:', found.length ? JSON.stringify(found, null, 2) : 'No employee info found in last 200')
}

checkEvents()
