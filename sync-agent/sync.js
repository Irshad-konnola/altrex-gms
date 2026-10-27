const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const HikvisionClient = require('./hikvision');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Sync] ❌ Missing Supabase credentials in .env!');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');
const hikClient = new HikvisionClient();

/**
 * Syncs all mapped members from Supabase to the Hikvision Biometric Device.
 */
async function syncAllMembers() {
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];

  console.log(`\n======================================================`);
  console.log(`[Sync Agent] 🔄 Starting Biometric Sync (${new Date().toLocaleString()})`);
  console.log(`======================================================`);

  // 1. Fetch all members with an assigned device_user_id
  const { data: members, error } = await supabase
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
    .not('device_user_id', 'is', null)
    .order('device_user_id', { ascending: true });

  if (error) {
    console.error('[Sync] ❌ Failed to fetch members from Supabase:', error.message);
    return { success: false, error: error.message };
  }

  console.log(`[Sync] Found ${members.length} member(s) with assigned Face IDs in Supabase.`);

  let allowedCount = 0;
  let blockedCount = 0;
  let notEnrolledCount = 0;
  let errorCount = 0;

  for (const member of members) {
    const employeeNo = member.device_user_id;
    const name = member.full_name;

    // Filter memberships
    const allPlans = member.memberships || [];
    
    // Sort plans by end_date descending (latest first)
    allPlans.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

    // Find active plan where end_date >= today
    const activePlan = allPlans.find(p => p.end_date >= today && p.status !== 'cancelled');

    let isAllowed = false;
    let beginTime = '2024-01-01T00:00:00';
    let endTime = '2024-01-01T23:59:59';
    let isEnabled = true;
    let planSummary = 'No Plan';

    // If member is explicitly archived, inactive, or suspended
    if (member.status === 'archived' || member.status === 'inactive' || member.status === 'suspended') {
      isAllowed = false;
      isEnabled = false;
      endTime = '2020-01-01T23:59:59';
      planSummary = `Account ${member.status.toUpperCase()}`;
    } else if (activePlan) {
      // Member has an active membership!
      isAllowed = true;
      isEnabled = true;
      beginTime = `${activePlan.start_date}T00:00:00`;
      endTime = `${activePlan.end_date}T23:59:59`;
      planSummary = `Valid until ${activePlan.end_date}`;
    } else if (allPlans.length > 0) {
      // Member had a plan, but it is now expired
      isAllowed = false;
      isEnabled = true;
      const latestExpired = allPlans[0];
      beginTime = `${latestExpired.start_date || '2024-01-01'}T00:00:00`;
      endTime = `${latestExpired.end_date}T23:59:59`; // Stored in the past, hardware blocks them!
      planSummary = `EXPIRED on ${latestExpired.end_date}`;
    } else {
      // No plans registered
      isAllowed = false;
      isEnabled = false;
      endTime = '2020-01-01T23:59:59';
      planSummary = 'No membership history';
    }

    try {
      const result = await hikClient.setUserValidity({
        employeeNo,
        name,
        beginTime,
        endTime,
        enable: isEnabled
      });

      if (result.success) {
        if (isAllowed) {
          allowedCount++;
          console.log(`  ✅ [ALLOWED] [ID: ${employeeNo.padEnd(3)}] ${name.padEnd(20)} -> ${planSummary}`);
        } else {
          blockedCount++;
          console.log(`  🔒 [BLOCKED] [ID: ${employeeNo.padEnd(3)}] ${name.padEnd(20)} -> ${planSummary}`);
        }
      } else if (result.notEnrolled) {
        notEnrolledCount++;
        console.log(`  ℹ️  [PENDING] [ID: ${employeeNo.padEnd(3)}] ${name.padEnd(20)} -> Not yet registered on device`);
      } else {
        errorCount++;
        console.warn(`  ⚠️  [ERROR]   [ID: ${employeeNo.padEnd(3)}] ${name.padEnd(20)} -> ${result.message}`);
      }
    } catch (err) {
      errorCount++;
      console.error(`  ❌ [FAILED]  [ID: ${employeeNo.padEnd(3)}] ${name.padEnd(20)} -> ${err.message}`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`------------------------------------------------------`);
  console.log(`[Sync Summary] Finished in ${durationSec}s:`);
  console.log(`  • Active (Door Access Granted): ${allowedCount}`);
  console.log(`  • Expired / Blocked:            ${blockedCount}`);
  console.log(`  • Not Enrolled on Terminal:    ${notEnrolledCount}`);
  if (errorCount > 0) {
    console.log(`  • Errors encountered:          ${errorCount}`);
  }
  console.log(`======================================================\n`);

  return {
    success: true,
    total: members.length,
    allowedCount,
    blockedCount,
    notEnrolledCount,
    errorCount,
    durationSec
  };
}

module.exports = {
  syncAllMembers,
  hikClient,
  supabase
};
