process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env variables
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.length > 0 && val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val.trim();
  }
});

const souvenirUrl = env.SOUVENIR_SUPABASE_URL;
const souvenirKey = env.SOUVENIR_SUPABASE_ANON_KEY;
const truckUrl = env.TRUCK_SUPABASE_URL;
const truckKey = env.TRUCK_SUPABASE_ANON_KEY;

console.log('Testing Souvenir DB:', souvenirUrl);
console.log('Testing Truck DB:', truckUrl);

async function testSouvenir() {
  if (!souvenirUrl || !souvenirKey) {
    console.log('Souvenir config missing!');
    return;
  }
  const client = createClient(souvenirUrl, souvenirKey);
  console.log('Connecting to Souvenir DB...');
  const start = Date.now();
  try {
    const { data, error } = await client.from('orders').select('*').limit(1);
    const duration = Date.now() - start;
    if (error) {
      console.error(`Souvenir DB Query Error (${duration}ms):`, error.message);
    } else {
      console.log(`Souvenir DB Connect Success (${duration}ms)! Found ${data.length} records.`);
    }
  } catch (err) {
    console.error(`Souvenir DB Exception (${Date.now() - start}ms):`, err.message);
  }
}

async function testTruck() {
  if (!truckUrl || !truckKey) {
    console.log('Truck config missing!');
    return;
  }
  const client = createClient(truckUrl, truckKey);
  console.log('Connecting to Truck DB...');
  const start = Date.now();
  try {
    const { data, error } = await client.from('trips').select('*').limit(1);
    const duration = Date.now() - start;
    if (error) {
      console.error(`Truck DB Query Error (${duration}ms):`, error.message);
    } else {
      console.log(`Truck DB Connect Success (${duration}ms)! Found ${data.length} records.`);
    }
  } catch (err) {
    console.error(`Truck DB Exception (${Date.now() - start}ms):`, err.message);
  }
}

async function run() {
  await testSouvenir();
  console.log('------------------------------------');
  await testTruck();
}

run();
