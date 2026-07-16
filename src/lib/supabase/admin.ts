import 'server-only'

import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with the service role key.
 * Required for auth.admin operations (invite, ban, etc.).
 * NEVER expose this client or its key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase admin credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY)'
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
