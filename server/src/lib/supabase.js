import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const isSupabaseConfigured =
  Boolean(env.SUPABASE_URL) &&
  !env.SUPABASE_URL.includes('dummy') &&
  !env.SUPABASE_URL.includes('placeholder') &&
  !env.SUPABASE_URL.includes('example.com') &&
  Boolean(env.SUPABASE_SERVICE_ROLE_KEY) &&
  !env.SUPABASE_SERVICE_ROLE_KEY.includes('dummy') &&
  !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

// Server-side admin client using the service role key (bypasses RLS)
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

/**
 * Creates a scoped Supabase client with the user's JWT to enforce RLS in database queries.
 * @param {string} userJwt
 */
export function createUserSupabaseClient(userJwt) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: WebSocket,
    },
    global: {
      headers: {
        Authorization: `Bearer ${userJwt}`,
      },
    },
  });
}
