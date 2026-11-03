const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const HikvisionClient = require('./hikvision');

const idsToDelete = process.argv.slice(2);

if (idsToDelete.length === 0) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        ALTREX GMS - DELETE HARDWARE USERS HELPER             ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  node delete-device-users.js <FaceID1> [FaceID2] [FaceID3] ...

Examples:
  node delete-device-users.js 1 86 100
  `);
  process.exit(1);
}

async function run() {
  const client = new HikvisionClient();
  console.log(`Connecting to Hikvision terminal at ${client.ip}:${client.port}...`);

  for (const id of idsToDelete) {
    console.log(`\nDeleting Face ID "${id}" from terminal hardware...`);
    try {
      const res = await client.deleteUser(id);
      if (res.success) {
        console.log(`✅ Face ID "${id}" successfully deleted from device.`);
      } else {
        console.error(`❌ Failed to delete Face ID "${id}":`, res.error || res);
      }
    } catch (err) {
      console.error(`❌ Error deleting Face ID "${id}":`, err.message);
    }
  }
  console.log(`\nCompleted.`);
}

run();
