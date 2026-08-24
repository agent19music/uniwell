/**
 * Platform fallback. Metro selects supabase.web.ts / supabase.native.ts first.
 */
import { createClient } from '@supabase/supabase-js';

import { getSupabaseEnv } from '@/lib/contracts/env';
import type { Database } from '@/types/database';

const { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } = getSupabaseEnv();

export const supabaseClient = createClient<Database>(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/** Compatibility alias while remaining call sites migrate onto generated table types. */
export const supabase = supabaseClient as any;
