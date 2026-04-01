import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Single Supabase client per SaaS.
 *
 * One Supabase project, two schemas:
 * - `saas_core` schema: platform tables (tenants, auth, billing, plugins)
 * - `public` schema: project tables (per-SaaS data — clients, orders, patients, etc.)
 *
 * Env vars: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 */

let client: SupabaseClient | null = null

/** Schema name for core platform tables */
export const CORE_SCHEMA = 'saas_core'

export function createSupabaseClient(url?: string, anonKey?: string): SupabaseClient {
  if (client) return client

  const supabaseUrl = url || ''
  const supabaseKey = anonKey || ''

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and anon key are required. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: true, persistSession: true },
  })

  return client
}

/** Get the Supabase client — throws if not initialized (unless mock mode) */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient() first.')
  }
  return client
}

/**
 * Safe getter — returns the client or null.
 * Use this in components/hooks that may render before Supabase is initialized
 * or when running in mock/offline mode.
 */
export function getSupabaseClientSafe(): SupabaseClient | null {
  return client
}

/** Optional getter — returns null if not initialized */
export function getSupabaseClientOptional(): SupabaseClient | null {
  return client
}

/** Get a client scoped to the core platform schema */
export function getCoreClient(): ReturnType<SupabaseClient['schema']> {
  return getSupabaseClient().schema(CORE_SCHEMA)
}

// Legacy aliases for backward compatibility
export const getCoreSupabaseClient = getSupabaseClient
export const getProjectSupabaseClient = getSupabaseClient
