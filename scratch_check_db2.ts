// scratch_check_db2.ts
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function checkEvents() {
  console.log('Checking device_events...')
  const { data, error } = await supabaseAdmin
    .from('device_events')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error fetching:', error)
  } else {
    console.log('Recent events:', JSON.stringify(data, null, 2))
  }
}

checkEvents()
