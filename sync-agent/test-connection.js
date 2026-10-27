const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const HikvisionClient = require('./hikvision');
const { createClient } = require('@supabase/supabase-js');

async function testAll() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║             ALTREX SYNC AGENT - DIAGNOSTIC TEST              ║
╚══════════════════════════════════════════════════════════════╝
  `);

  const ip = process.env.HIKVISION_IP || '192.168.1.100';
  const port = process.env.HIKVISION_PORT || '80';
  const user = process.env.HIKVISION_USER || 'admin';
  const pass = process.env.HIKVISION_PASS || '';

  console.log(`[Config Check]`);
  console.log(`  • Terminal Target: http://${ip}:${port}`);
  console.log(`  • Terminal User:   ${user}`);
  console.log(`  • Password Set:    ${pass ? 'YES (***)' : 'NO (EMPTY!)'}`);
  console.log(`  • Supabase URL:    ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}\n`);

  // 1. TEST SUPABASE DATABASE
  console.log(`------------------------------------------------------`);
  console.log(`1. Testing Supabase Cloud Database Connection...`);
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { count, error } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .not('device_user_id', 'is', null);

    if (error) {
      console.error(`   ❌ Supabase Error: ${error.message}`);
    } else {
      console.log(`   ✅ Supabase Connected! Found ${count} member(s) with Face IDs.`);
    }
  } catch (err) {
    console.error(`   ❌ Supabase Connection Failed: ${err.message}`);
  }

  // 2. TEST HIKVISION DEVICE CONNECTION
  console.log(`\n------------------------------------------------------`);
  console.log(`2. Testing Hikvision Terminal Connection (LAN)...`);
  const client = new HikvisionClient({ ip, port, user, pass });

  try {
    const deviceInfo = await client.getDeviceInfo();
    console.log(`   ✅ Connection Successful! Device responded via Digest Auth.`);
    console.log(`   Device Info Payload:`);
    console.log(typeof deviceInfo === 'object' ? JSON.stringify(deviceInfo, null, 2) : deviceInfo);
  } catch (err) {
    console.error(`   ❌ Hikvision Connection Failed!`);
    console.error(`   Error: ${err.message}`);
    console.error(`\n   Troubleshooting Checklist:`);
    console.error(`   1. Is your Windows PC connected to the same Wi-Fi/router as the Hikvision machine?`);
    console.error(`   2. Is the IP address in .env (${ip}) correct?`);
    console.error(`   3. Is the admin password in .env correct?`);
  }

  // 3. TEST HIKVISION SYSTEM CLOCK
  console.log(`\n------------------------------------------------------`);
  console.log(`3. Checking Hikvision Terminal Clock...`);
  try {
    const timeInfo = await client.getDeviceTime();
    console.log(`   🕒 Device Time:`, typeof timeInfo === 'object' ? JSON.stringify(timeInfo) : timeInfo);
    console.log(`   💻 PC Local Time: ${new Date().toLocaleString()}`);
  } catch (err) {
    console.warn(`   ⚠️ Could not fetch device clock: ${err.message}`);
  }

  console.log(`\n======================================================`);
  console.log(`Diagnostic Finished.`);
  console.log(`======================================================\n`);
}

testAll();
