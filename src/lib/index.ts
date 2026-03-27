export { cn } from './cn'
export { createSupabaseClient, getSupabaseClient, getSupabaseClientOptional } from './supabase'
export { createApiClient, ApiError } from './api'
export {
  useRouter,
  RouterProvider,
  setGlobalRouter,
  getGlobalRouter,
  windowRouterAdapter,
  hashRouterAdapter,
  reactRouterAdapter,
} from './router'
export type { RouterAdapter } from './router'
export { AuthAdapterProvider, useAuthAdapter, useAuthAdapterOptional } from './auth-context'
export { createMockAuthAdapter } from './auth-adapters/mock'
export { createSupabaseAuthAdapter } from './auth-adapters/supabase'
export type { DataProvider, CrudQuery, CrudResult } from './data-providers/types'
export { createMockProvider } from './data-providers/mock'
export { OrgAdapterProvider, useOrgAdapter, useOrgAdapterOptional } from './org-context'
export { createMockOrgAdapter } from './org-adapters/mock'
export { createSupabaseOrgAdapter } from './org-adapters/supabase'
export { createSupabaseProvider } from './data-providers/supabase'
export type { SupabaseProviderConfig } from './data-providers/supabase'
export { createArchetypeProvider } from './data-providers/archetype'
export type { ArchetypeProviderConfig } from './data-providers/archetype'
export {
  createPlugin,
  getWidgetsForZone,
  PluginRuntimeProvider,
  resolvePluginRuntime,
  usePluginRuntime,
  usePluginRuntimeOptional,
} from './plugins'
