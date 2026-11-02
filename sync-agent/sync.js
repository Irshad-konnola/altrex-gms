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

function getTodayIST() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

/**
 * Evaluates whether a member is allowed through the door and returns
 * the exact Hikvision hardware validity payload parameters.
 * 
 * Rules:
 * 1. Valid.enable MUST ALWAYS BE true on Hikvision.
 *    If enable is false, Hikvision turns OFF expiration checks and grants perpetual access!
 * 2. Active members: beginTime = earliest start_date <= today, endTime = latest end_date >= today.
 * 3. Expired / Blocked / Inactive members: beginTime and endTime are set to past dates
 *    (e.g. 2026-01-01 -> 2026-01-02 or their expired plan end_date).
 *    Because currentTime > endTime, Hikvision displays "Expired" and keeps the door locked.
 * 4. beginTime must strictly be <= endTime to satisfy Hikvision ISAPI validation.
 */
function evaluateMemberAccess(member, today = getTodayIST()) {
  const allPlans = (member.memberships || []).filter(p => p.status !== 'cancelled');

  // Sort plans descending by end_date (furthest expiration first)
  allPlans.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

  // Plans active today or in future
  const futurePlans = allPlans.filter(p => p.end_date >= today);
  const currentlyActivePlans = futurePlans.filter(p => p.start_date <= today);

  const isAccountBlocked = ['archived', 'inactive', 'suspended', 'expired'].includes(member.status);

  let isAllowed = false;
  let isEnabled = true; // MUST ALWAYS BE TRUE to enforce validity rules
  let beginTime = '2026-01-01T00:00:00';
  let endTime = '2026-01-02T23:59:59';
  let planSummary = 'No Plan';

  if (isAccountBlocked) {
    // Explicitly blocked/expired in dashboard
    isAllowed = false;
    isEnabled = true;
    beginTime = '2026-01-01T00:00:00';
    endTime = '2026-01-02T23:59:59';
    planSummary = `Account ${member.status.toUpperCase()}`;
  } else if (futurePlans.length > 0) {
    if (currentlyActivePlans.length > 0) {
      // Active right now!
      isAllowed = true;
      isEnabled = true;
      const earliestStart = currentlyActivePlans.reduce((min, p) => p.start_date < min ? p.start_date : min, currentlyActivePlans[0].start_date);
      const latestEnd = futurePlans.reduce((max, p) => p.end_date > max ? p.end_date : max, futurePlans[0].end_date);
      beginTime = `${earliestStart}T00:00:00`;
      endTime = `${latestEnd}T23:59:59`;
      planSummary = `Valid until ${latestEnd}`;
    } else {
      // Future plan starting later
      isAllowed = false;
      isEnabled = true;
      const earliestStart = futurePlans.reduce((min, p) => p.start_date < min ? p.start_date : min, futurePlans[0].start_date);
      const latestEnd = futurePlans.reduce((max, p) => p.end_date > max ? p.end_date : max, futurePlans[0].end_date);
      beginTime = `${earliestStart}T00:00:00`;
      endTime = `${latestEnd}T23:59:59`;
      planSummary = `Upcoming (Starts ${earliestStart})`;
    }
  } else if (allPlans.length > 0) {
    // Member had plans in the past, but all are expired
    isAllowed = false;
    isEnabled = true;
    const latestExpired = allPlans[0];
    endTime = `${latestExpired.end_date}T23:59:59`;
    const endD = new Date(latestExpired.end_date);
    endD.setDate(endD.getDate() - 30);
    beginTime = (latestExpired.start_date && latestExpired.start_date <= latestExpired.end_date)
      ? `${latestExpired.start_date}T00:00:00`
      : endD.toISOString().split('T')[0] + 'T00:00:00';
    planSummary = `EXPIRED on ${latestExpired.end_date}`;
  } else {
    // No plans registered
    isAllowed = false;
    isEnabled = true;
    beginTime = '2026-01-01T00:00:00';
    endTime = '2026-01-02T23:59:59';
    planSummary = 'No active plan / Expired';
  }

  // Strict safety check: Hikvision requires beginTime <= endTime
  if (new Date(beginTime).getTime() > new Date(endTime).getTime()) {
    const endD = new Date(endTime);
    endD.setDate(endD.getDate() - 30);
    beginTime = endD.toISOString().split('T')[0] + 'T00:00:00';
  }

  return {
    isAllowed,
    isEnabled,
    beginTime,
    endTime,
    planSummary
  };
}

/**
 * Syncs all mapped members from Supabase to the Hikvision Biometric Device.
 */
async function syncAllMembers() {
  const startTime = Date.now();
  const today = getTodayIST();

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

    const access = evaluateMemberAccess(member, today);

    try {
      const result = await hikClient.setUserValidity({
        employeeNo,
        name,
        beginTime: access.beginTime,
        endTime: access.endTime,
        enable: access.isEnabled
      });

      if (result.success) {
        if (access.isAllowed) {
          allowedCount++;
          console.log(`  ✅ [ALLOWED] [ID: ${employeeNo.padEnd(3)}] ${name.padEnd(20)} -> ${access.planSummary}`);
        } else {
          blockedCount++;
          console.log(`  🔒 [BLOCKED] [ID: ${employeeNo.padEnd(3)}] ${name.padEnd(20)} -> ${access.planSummary}`);
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
  evaluateMemberAccess,
  hikClient,
  supabase
};
