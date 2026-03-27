import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Two Supabase clients:
 * - `core` — shared platform DB (auth, tenants, billing, plugins, permissions)
 * - `project` — per-SaaS project DB (clients, appointments, products, etc.)
 *
 * Env vars:
 * - VITE_SAAS_CORE_SUPABASE_URL / VITE_SAAS_CORE_ANON_KEY — platform DB
 * - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — project DB
 *
 * If only one set is provided, it's used for both (single-DB mode).
 */

let coreClient: SupabaseClient | null = null
let projectClient: SupabaseClient | null = null

function envVar(name: string): string {
  // Vite uses import.meta.env at compile time, but we receive values via createSupabaseClient params
  // This fallback handles Node/SSR environments
  return (typeof process !== 'undefined' && process.env?.[name]) || ''
}

/** Initialize the core (platform) Supabase client */
export function createCoreSupabaseClient(url?: string, anonKey?: string): SupabaseClient {
  if (coreClient) return coreClient

  const supabaseUrl = url || envVar('VITE_SAAS_CORE_SUPABASE_URL') || envVar('VITE_SUPABASE_URL')
  const supabaseKey = anonKey || envVar('VITE_SAAS_CORE_ANON_KEY') || envVar('VITE_SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Core Supabase URL and anon key are required.')
  }

  coreClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: true, persistSession: true },
  })

  return coreClient
}

/** Initialize the project (per-SaaS) Supabase client */
export function createProjectSupabaseClient(url?: string, anonKey?: string): SupabaseClient {
  if (projectClient) return projectClient

  const supabaseUrl = url || envVar('VITE_SUPABASE_URL')
  const supabaseKey = anonKey || envVar('VITE_SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Project Supabase URL and anon key are required.')
  }

  projectClient = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: true, persistSession: true },
  })

  return projectClient
}

/**
 * Legacy: createSupabaseClient initializes BOTH clients.
 * If coreUrl/coreKey are provided, uses separate DBs.
 * Otherwise, single-DB mode (same client for both).
 */
export function createSupabaseClient(
  url?: string,
  anonKey?: string,
  coreUrl?: string,
  coreAnonKey?: string,
): SupabaseClient {
  // Core client — uses dedicated core URL if provided, otherwise falls back to project URL
  const resolvedCoreUrl = coreUrl || url
  const resolvedCoreKey = coreAnonKey || anonKey

  if (resolvedCoreUrl && resolvedCoreKey) {
    createCoreSupabaseClient(resolvedCoreUrl, resolvedCoreKey)
  }

  // Project client
  if (url && anonKey) {
    createProjectSupabaseClient(url, anonKey)
  }

  // In single-DB mode, both point to the same client
  if (!projectClient && coreClient) {
    projectClient = coreClient
  }
  if (!coreClient && projectClient) {
    coreClient = projectClient
  }

  return coreClient ?? projectClient!
}

/** Get the core (platform) client — throws if not initialized */
export function getCoreSupabaseClient(): SupabaseClient {
  if (!coreClient) throw new Error('Core Supabase client not initialized.')
  return coreClient
}

/** Get the project (per-SaaS) client — throws if not initialized */
export function getProjectSupabaseClient(): SupabaseClient {
  if (!projectClient) throw new Error('Project Supabase client not initialized.')
  return projectClient
}

/** Legacy: getSupabaseClient returns core client for backward compat */
export function getSupabaseClient(): SupabaseClient {
  if (!coreClient && !projectClient) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient() first.')
  }
  return coreClient ?? projectClient!
}

/** Optional getter — returns null if not initialized (used by CRUD data provider) */
export function getSupabaseClientOptional(): SupabaseClient | null {
  return projectClient ?? coreClient
}
