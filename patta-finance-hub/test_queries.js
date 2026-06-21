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

async function testSouvenirQuery() {
  if (!souvenirUrl || !souvenirKey) return;
  const client = createClient(souvenirUrl, souvenirKey);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  console.log('Souvenir Query GTE Date:', thirtyDaysAgo.toISOString());
  const { data, error } = await client
    .from('orders')
    .select('total_price, created_at, status')
    .in('status', ['paid', 'shipping', 'completed'])
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Souvenir Query Error:', error);
  } else {
    console.log('Souvenir Query Success! Rows found:', data.length);
    if (data.length > 0) {
      console.log('First row:', data[0]);
    } else {
      // Let's see some orders without filters to check dates/statuses
      const { data: allOrders, error: err2 } = await client
        .from('orders')
        .select('total_price, created_at, status')
        .limit(5);
      console.log('All orders (no filters, limit 5):', allOrders);
    }
  }
}

async function testTruckQuery() {
  if (!truckUrl || !truckKey) return;
  const client = createClient(truckUrl, truckKey);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
  
  console.log('Truck Query GTE Date:', thirtyDaysAgoStr);
  const { data, error } = await client
    .from('trips')
    .select('price, date, fuel, wage, maintenance')
    .gte('date', thirtyDaysAgoStr);

  if (error) {
    console.error('Truck Query Error:', error);
  } else {
    console.log('Truck Query Success! Rows found:', data.length);
    if (data.length > 0) {
      console.log('First row:', data[0]);
    } else {
      // Let's see some trips without filters
      const { data: allTrips, error: err2 } = await client
        .from('trips')
        .select('*')
        .limit(5);
      console.log('All trips (no filters, limit 5):', allTrips);
    }
  }
}

async function run() {
  await testSouvenirQuery();
  console.log('------------------------------------');
  await testTruckQuery();
}

run();
