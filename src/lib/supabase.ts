import { isSupabaseConfigured, isLocalDevMode, usingDevBackend } from './env';
import { createDevSupabaseClient } from './devSupabase';
import { createClient } from '@supabase/supabase-js';

export { usingDevBackend };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createSupabaseClient() {
  if (isLocalDevMode()) {
    return createDevSupabaseClient();
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
