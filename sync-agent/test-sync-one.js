const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const HikvisionClient = require('./hikvision');
const { evaluateMemberAccess } = require('./sync');

const targetId = process.argv[2];

if (!targetId) {
  console.log(`
Usage:
  node test-sync-one.js <device_user_id>

Example:
  node test-sync-one.js 1
  node test-sync-one.js 86
  `);
  process.exit(1);
}

async function testSingle() {
  console.log(`\n[Test Sync] Looking up Face ID: "${targetId}" in Supabase...`);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: member, error } = await supabase
    .from('members')
    .select(`
      id,
      full_name,
      status,
      device_user_id,
      memberships (
        id,
        start_date,
        end_date,
        status,
        membership_plans (
          name
        )
      )
    `)
    .eq('device_user_id', String(targetId))
    .single();

  if (error || !member) {
    console.error(`❌ Member with device_user_id "${targetId}" not found in Supabase!`);
    if (error) console.error(error.message);
    process.exit(1);
  }

  const access = evaluateMemberAccess(member);

  console.log(`\nMember Found:`);
  console.log(`  • Name:           ${member.full_name}`);
  console.log(`  • Face ID:        ${member.device_user_id}`);
  console.log(`  • Plan Status:    ${access.isAllowed ? '✅ ACTIVE (Access Granted)' : '🔒 EXPIRED / BLOCKED (Door Locked)'}`);
  console.log(`  • Plan Summary:   ${access.planSummary}`);
  console.log(`  • Validity Range: ${access.beginTime}  --->  ${access.endTime}`);
  console.log(`  • Hardware Enable: ${access.isEnabled} (True = Hardware enforces schedule)`);

  console.log(`\nConnecting to Hikvision terminal to apply validity...`);
  const hikClient = new HikvisionClient();

  try {
    const result = await hikClient.setUserValidity({
      employeeNo: member.device_user_id,
      name: member.full_name,
      beginTime: access.beginTime,
      endTime: access.endTime,
      enable: access.isEnabled
    });

    if (result.success) {
      console.log(`\n🎉 SUCCESS! Hardware validity updated on Hikvision terminal.`);
      console.log(`   ${access.isAllowed ? 'Door access is now GRANTED for this member.' : 'Door access is now BLOCKED (Terminal screen will show Expired).'}\n`);
    } else if (result.notEnrolled) {
      console.warn(`\n⚠️  The user with ID ${targetId} has not had their face scanned/enrolled on the physical machine yet.`);
      console.warn(`   Please enroll them on the machine first, then re-run this test.\n`);
    } else {
      console.error(`\n❌ Failed to update on terminal:`, result.message);
      if (result.raw) console.error(result.raw);
    }
  } catch (err) {
    console.error(`\n❌ Connection Error:`, err.message);
  }
}

testSingle();
