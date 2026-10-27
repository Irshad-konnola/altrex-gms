const path = require('path');
const { syncAllMembers, hikClient, supabase } = require('./sync');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const INTERVAL_SECONDS = parseInt(process.env.SYNC_INTERVAL_SECONDS || '60', 10);
let isSyncing = false;

async function checkDeviceHealth() {
  console.log(`[Health Check] Pinging Hikvision terminal at http://${hikClient.ip}:${hikClient.port}...`);
  try {
    const info = await hikClient.getDeviceInfo();
    console.log(`[Health Check] ✅ Connected to Hikvision Terminal!`);
    
    // Check device time
    try {
      const timeData = await hikClient.getDeviceTime();
      const devTimeStr = timeData?.Time?.localTime || timeData;
      console.log(`[Health Check] 🕒 Device Local Time: ${devTimeStr}`);
      
      const currentYear = new Date().getFullYear();
      if (typeof devTimeStr === 'string' && !devTimeStr.includes(String(currentYear))) {
        console.warn(`\n⚠️  WARNING: The device clock may not match current year (${currentYear})!`);
        console.warn(`   Please ensure your Hikvision terminal clock is synchronized under:`);
        console.warn(`   Menu -> System -> Time Settings -> NTP or Sync with PC.\n`);
      }
    } catch {
      // Ignore time read failure if endpoint varies
    }

    return true;
  } catch (err) {
    console.error(`[Health Check] ❌ Could NOT connect to Hikvision terminal:`);
    console.error(`   ${err.message}`);
    console.error(`   Ensure the PC is connected to the Gym Wi-Fi/LAN and the IP in .env is correct.`);
    return false;
  }
}

async function runSyncSafely() {
  if (isSyncing) {
    console.log(`[Sync Agent] ⏳ Previous sync still in progress, skipping cycle...`);
    return;
  }

  isSyncing = true;
  try {
    await syncAllMembers();
  } catch (err) {
    console.error(`[Sync Agent] ❌ Unexpected error during sync cycle:`, err);
  } finally {
    isSyncing = false;
  }
}

function setupRealtimeListener() {
  try {
    console.log(`[Realtime] ⚡ Subscribing to instant database changes from Supabase...`);

    const channel = supabase
      .channel('altrex-device-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memberships' },
        (payload) => {
          console.log(`\n[Realtime] 🔔 Membership updated in dashboard (${payload.eventType}). Triggering instant sync...`);
          runSyncSafely();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        (payload) => {
          console.log(`\n[Realtime] 🔔 Member updated in dashboard (${payload.eventType}). Triggering instant sync...`);
          runSyncSafely();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ✅ Live sync enabled. Changes from dashboard will sync in real-time.`);
        }
      });
  } catch (err) {
    console.warn(`[Realtime] Note: Realtime listener could not attach (${err.message}). Polling will continue as backup.`);
  }
}

async function start() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║               ALTREX GMS - BIOMETRIC SYNC AGENT              ║
║         Automatic Face Terminal Expiration Enforcement       ║
╚══════════════════════════════════════════════════════════════╝
  `);

  console.log(`Configuration:`);
  console.log(`  • Terminal IP:      ${hikClient.ip}:${hikClient.port}`);
  console.log(`  • Terminal User:    ${hikClient.user}`);
  console.log(`  • Supabase Project: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`  • Polling Interval: Every ${INTERVAL_SECONDS} seconds\n`);

  // 1. Initial Device Health Check
  const isHealthy = await checkDeviceHealth();
  if (!isHealthy) {
    console.warn(`\n⚠️  Hikvision device is currently unreachable. The agent will continue running and retry automatically.`);
  }

  // 2. Run first sync
  await runSyncSafely();

  // 3. Enable Realtime Listener (Instant sync on web dashboard actions)
  setupRealtimeListener();

  // 4. Start recurring interval loop as safety net
  console.log(`[Sync Agent] 🚀 Agent is now actively running in the background.`);
  console.log(`[Sync Agent] Press Ctrl+C to stop.\n`);

  setInterval(() => {
    runSyncSafely();
  }, INTERVAL_SECONDS * 1000);
}

// Graceful exit handlers
process.on('SIGINT', () => {
  console.log('\n[Sync Agent] Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Sync Agent] Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

start();
