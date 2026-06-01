// ═══════════════════════════════════════════════════════
// db.ts — Supabase Clients (single source of truth)
// ═══════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';

const DB_OPTIONS = {
  auth: { autoRefreshToken: false, persistSession: false },
};

/** Returns both Supabase clients: jouda (app) + inventory (stock) */
export function getClients() {
  return {
    jouda: createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      DB_OPTIONS,
    ),
    inventory: createClient(
      Deno.env.get('INVENTORY_SUPABASE_URL')!,
      Deno.env.get('INVENTORY_SERVICE_ROLE_KEY')!,
      DB_OPTIONS,
    ),
  };
}
