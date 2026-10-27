const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const HikvisionClient = require('./hikvision');

const mode = (process.argv[2] || '').toLowerCase();
const faceId = process.argv[3] || '2'; // Default to Face ID 2 (Irshad)

if (!mode || (mode !== 'active' && mode !== 'expired')) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║               ALTREX QUICK FACE TEST HELPER                  ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  node test-my-face.js <active|expired> [faceId]

Examples:
  1. Set your face to ACTIVE (Door should UNLOCK):
     node test-my-face.js active 2

  2. Set your face to EXPIRED (Door should BLOCK & show "Expired"):
     node test-my-face.js expired 2
  `);
  process.exit(1);
}

async function run() {
  const client = new HikvisionClient();
  const isAllowed = mode === 'active';

  let beginTime, endTime;
  if (isAllowed) {
    beginTime = '2026-10-01T00:00:00';
    endTime = '2026-11-30T23:59:59'; // Future date
  } else {
    beginTime = '2026-09-01T00:00:00';
    endTime = '2026-10-01T23:59:59'; // Past date (Expired!)
  }

  console.log(`\nSetting Face ID "${faceId}" on Hikvision Terminal...`);
  console.log(`  • Mode:           ${isAllowed ? '✅ ACTIVE (Door will OPEN)' : '🔒 EXPIRED (Door will BLOCK)'}`);
  console.log(`  • Hardware Range: ${beginTime} ---> ${endTime}`);

  try {
    const res = await client.setUserValidity({
      employeeNo: faceId,
      name: faceId === '2' ? 'Irshad' : (faceId === '1' ? 'Shehin' : 'Test User'),
      beginTime,
      endTime,
      enable: true
    });

    if (res.success) {
      console.log(`\n🎉 SUCCESS! Hardware validity updated on the machine.`);
      if (isAllowed) {
        console.log(`👉 NOW: Stand in front of the terminal camera.`);
        console.log(`   Result expected: Screen flashes GREEN, welcome message, DOOR OPENS! 🔓\n`);
      } else {
        console.log(`👉 NOW: Stand in front of the terminal camera.`);
        console.log(`   Result expected: Screen flashes RED / "Expired", DOOR STAYS LOCKED! 🔒\n`);
      }
    } else {
      console.error(`❌ Terminal returned error:`, res.message);
    }
  } catch (err) {
    console.error(`❌ Failed:`, err.message);
  }
}

run();
