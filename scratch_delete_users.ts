import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function deleteUsers() {
  const users = ['shehin']

  for (const name of users) {
    console.log(`Finding user: ${name}...`)
    const { data: members, error: findError } = await supabaseAdmin
      .from('members')
      .select('id, full_name')
      .ilike('full_name', name)

    if (findError) {
      console.error(`Error finding ${name}:`, findError)
      continue
    }

    if (!members || members.length === 0) {
      console.log(`User ${name} not found.`)
      continue
    }

    for (const member of members) {
      console.log(`Found ${member.full_name} with ID ${member.id}. Deleting dependencies...`)
      
      await supabaseAdmin.from('whatsapp_logs').delete().eq('member_id', member.id)
      await supabaseAdmin.from('attendance_logs').delete().eq('member_id', member.id)
      await supabaseAdmin.from('payments').delete().eq('member_id', member.id)
      await supabaseAdmin.from('memberships').delete().eq('member_id', member.id)
      await supabaseAdmin.from('pt_assignments').delete().eq('member_id', member.id)

      const { error: delError } = await supabaseAdmin.from('members').delete().eq('id', member.id)
      if (delError) {
        console.error(`Failed to delete ${member.full_name}:`, delError)
      } else {
        console.log(`Successfully deleted ${member.full_name}!`)
      }
    }
  }
}

deleteUsers()
