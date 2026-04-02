export { resolveEntityRoute, resolveEntityHref } from './entity-routes'
export { cn } from './cn'
export { dedup } from './dedup'
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
export { createArchetypeLookup } from './archetype-lookup'
export { resolveDataProvider } from './data-providers/resolve'
export {
  getSchedules,
  saveSchedule,
  deleteSchedule,
  replaceWeeklySchedules,
  saveException,
  deleteException,
} from './schedule-service'
export type { ScheduleRecord, SaveScheduleInput, BlockSettings } from './schedule-service'
export { parseBlockSettings, mergeBlockSettings } from './schedule-service'
export { setScheduleBlockConfig, getScheduleBlockConfig, subscribeScheduleBlockConfig } from './schedule-config'
export type { ScheduleBlockConfig } from './schedule-config'
export { registerEntity, getRegisteredEntities, getEntityByKey, deriveEntityKey } from './entity-registry'
export type { RegisteredEntity } from './entity-registry'
export { applyFieldRules } from './apply-field-rules'
export { buildCSV, downloadCSV, exportCSV, escapeCSVField } from './csv'
export type { CSVColumn } from './csv'
export { I18nProvider, useI18nConfig, defaultTranslations, builtInLocales } from './i18n'
export { SUPPORTED_LOCALES, getLocaleOption } from './locale-config'
export type { LocaleOption } from './locale-config'
export { createClientOrdersProvider } from './create-client-orders-provider'
