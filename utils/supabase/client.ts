import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('evocrm_supabase_url');
    const localKey = localStorage.getItem('evocrm_supabase_anon_key');
    if (localUrl && localKey && !localUrl.includes('placeholder')) {
      supabaseUrl = localUrl;
      supabaseAnonKey = localKey;
    }
  }

  clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return clientInstance;
}
