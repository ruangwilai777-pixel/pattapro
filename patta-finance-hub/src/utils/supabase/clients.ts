process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';

const souvenirUrl = process.env.SOUVENIR_SUPABASE_URL || '';
const souvenirKey = process.env.SOUVENIR_SUPABASE_ANON_KEY || '';

const truckUrl = process.env.TRUCK_SUPABASE_URL || '';
const truckKey = process.env.TRUCK_SUPABASE_ANON_KEY || '';

// 1. Create client for Souvenir Shop Supabase
export const souvenirClient = 
  souvenirUrl && souvenirKey && !souvenirUrl.includes('your-souvenir')
    ? createClient(souvenirUrl, souvenirKey)
    : null;

// 2. Create client for Truck Dispatch Supabase
export const truckClient = 
  truckUrl && truckKey && !truckUrl.includes('your-truck')
    ? createClient(truckUrl, truckKey)
    : null;
