const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const HikvisionClient = require('./hikvision');

const targetId = process.argv[2];

if (!targetId) {
  console.log(`
Usage:
  node test-sync-one.js <device_user_id>

Example:
  node test-sync-one.js 44
  node test-sync-one.js 1
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

  const today = new Date().toISOString().split('T')[0];
  const allPlans = member.memberships || [];
  allPlans.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

  const activePlan = allPlans.find(p => p.end_date >= today && p.status !== 'cancelled');

  let isAllowed = false;
  let beginTime = '2024-01-01T00:00:00';
  let endTime = '2024-01-01T23:59:59';
  let isEnabled = true;

  if (activePlan) {
    isAllowed = true;
    isEnabled = true;
    beginTime = `${activePlan.start_date}T00:00:00`;
    endTime = `${activePlan.end_date}T23:59:59`;
  } else if (allPlans.length > 0) {
    isAllowed = false;
    isEnabled = true;
    const latestExpired = allPlans[0];
    beginTime = `${latestExpired.start_date || '2024-01-01'}T00:00:00`;
    endTime = `${latestExpired.end_date}T23:59:59`;
  } else {
    isAllowed = false;
    isEnabled = false;
    endTime = '2020-01-01T23:59:59';
  }

  console.log(`\nMember Found:`);
  console.log(`  • Name:           ${member.full_name}`);
  console.log(`  • Face ID:        ${member.device_user_id}`);
  console.log(`  • Plan Status:    ${isAllowed ? '✅ ACTIVE' : '🔒 EXPIRED / BLOCKED'}`);
  console.log(`  • Validity Range: ${beginTime}  --->  ${endTime}`);
  console.log(`  • Hardware Enable: ${isEnabled}`);

  console.log(`\nConnecting to Hikvision terminal to apply validity...`);
  const hikClient = new HikvisionClient();

  try {
    const result = await hikClient.setUserValidity({
      employeeNo: member.device_user_id,
      name: member.full_name,
      beginTime,
      endTime,
      enable: isEnabled
    });

    if (result.success) {
      console.log(`\n🎉 SUCCESS! Hardware validity updated on Hikvision terminal.`);
      console.log(`   ${isAllowed ? 'Door access is now GRANTED for this member.' : 'Door access is now BLOCKED (Screen will show Expired).'}\n`);
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
