import { createClient } from 'jsr:@supabase/supabase-js@2';

const serviceClient = (url: string, key: string) =>
  createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

let _jouda: ReturnType<typeof serviceClient> | null = null;
let _inventory: ReturnType<typeof serviceClient> | null = null;

export function jouda() {
  if (!_jouda) _jouda = serviceClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  return _jouda;
}

export function inventory() {
  if (!_inventory) _inventory = serviceClient(Deno.env.get('INVENTORY_SUPABASE_URL')!, Deno.env.get('INVENTORY_SERVICE_ROLE_KEY')!);
  return _inventory;
}
