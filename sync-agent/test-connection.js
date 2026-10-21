const { request } = require('urllib');

// REPLACE THESE WITH YOUR MACHINE'S DETAILS
const HIKVISION_IP = '192.168.1.100'; // e.g., 192.168.1.200
const HIKVISION_USER = 'admin';
const HIKVISION_PASS = 'YOUR_MACHINE_PASSWORD';

async function testConnection() {
  console.log(`Connecting to Hikvision machine at ${HIKVISION_IP}...`);
  const url = `http://${HIKVISION_IP}/ISAPI/System/deviceInfo`;

  try {
    const { data, res } = await request(url, {
      method: 'GET',
      digestAuth: `${HIKVISION_USER}:${HIKVISION_PASS}`,
      dataType: 'text', // Returns XML usually
      timeout: 5000,
    });

    if (res.status === 200) {
      console.log('✅ Connection Successful!');
      console.log('Device Info:');
      console.log(data);
    } else {
      console.log(`⚠️ Connected, but got status: ${res.status}`);
      console.log(data);
    }
  } catch (error) {
    console.error('❌ Connection Failed!');
    console.error('Make sure the IP address is correct, the PC is on the same Wi-Fi, and the password is correct.');
    console.error(error.message);
  }
}

testConnection();
