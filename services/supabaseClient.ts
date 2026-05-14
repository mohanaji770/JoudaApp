import { createClient } from '@supabase/supabase-js';

// Vite env types
const env = (import.meta as any).env;
const supabaseUrl = env?.VITE_SUPABASE_URL as string;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env.local');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

export type SupabaseClient = typeof supabase;
