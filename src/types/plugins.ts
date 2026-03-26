import type React from 'react'
import type { LayoutVariant } from './layout'
import type { PermissionAction } from './permissions'

// --- Database-facing types (map to Supabase tables) ---

export type VerticalId = 'beauty' | 'food' | 'health' | 'services'

export interface Vertical {
  id: VerticalId
  name: string
  description?: string
  icon?: string
  defaultPlugins: string[]
  createdAt: string
}

export type PluginScope = 'core' | 'vertical' | 'universal' | 'addon' | 'tenant'
export type PluginStatus = 'pending_setup' | 'active' | 'disabled' | 'removed'

export interface PluginRegistryEntry {
  id: string
  name: string
  description?: string
  descriptionNl?: string
  icon?: string
  version: string
  scope: PluginScope
  verticalId?: VerticalId
  tenantId?: string
  minPlan: string
  isDefault: boolean
  manifest: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface TenantPlugin {
  id: string
  tenantId: string
  pluginId: string
  status: PluginStatus
  config: Record<string, unknown>
  enabledBy?: string
  enabledAt?: string
  disabledAt?: string
  createdAt: string
  updatedAt: string
}

export interface PluginDependency {
  id: string
  pluginId: string
  dependsOn: string
  isOptional: boolean
}

// --- Runtime types (used by the plugin loader) ---

export interface PluginPermissionRequirement {
  feature: string
  action: PermissionAction
}

export interface PluginNavigationEntry {
  id?: string
  section: 'main' | 'secondary' | 'settings'
  position: number
  label: string
  route: string
  icon?: string
  badge?: string | number
  permission?: PluginPermissionRequirement
}

export interface PluginSettingsTab {
  id: string
  label: string
  component: React.ComponentType<any>
  pluginId?: string
  order?: number
  permission?: PluginPermissionRequirement
}

export interface LegacyPluginSettingsTab {
  tab: string
  component: React.ComponentType<any>
}

export interface PluginRouteDefinition {
  path: string
  component: React.ComponentType<any>
  guard?: 'authenticated' | 'role'
  roles?: string[]
  permission?: PluginPermissionRequirement
}

export type PluginWidgetZone =
  | 'shell.sidebar.before-nav'
  | 'shell.sidebar.footer'
  | 'shell.topbar.start'
  | 'shell.topbar.end'
  | 'page.before'
  | 'page.after'
  | 'settings.before'
  | 'settings.after'
  | 'shell.floating'
  | (string & {})

export interface PluginRuntimeTenant {
  id?: string
  slug?: string
  verticalId?: string
  plan?: string
}

export interface PluginRuntimeUser {
  id?: string
  role?: string
}

export interface PluginRuntimeContext {
  tenant: PluginRuntimeTenant | null
  user: PluginRuntimeUser | null
  currentPath: string
  matchedPath?: string
  layout: LayoutVariant
  hasPermission?: (requirement: PluginPermissionRequirement) => boolean
}

export interface PluginWidgetVisibility {
  routes?: string[]
  excludeRoutes?: string[]
  layouts?: LayoutVariant[]
  roles?: string[]
  plans?: string[]
  permissions?: PluginPermissionRequirement[]
  when?: (context: PluginRuntimeContext) => boolean
}

export interface PluginCapability {
  id: string
  label: string
  description?: string
  kind?: 'page' | 'widget' | 'data' | 'integration'
}

export interface PluginWidgetComponentProps<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  config: TConfig
  runtime: PluginRuntimeContext
  plugin: ResolvedPluginManifest
  widget: ResolvedPluginWidget<TConfig>
}

export interface PluginWidgetDefinition<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  zone: PluginWidgetZone
  component: React.ComponentType<any>
  title?: string
  order?: number
  permission?: PluginPermissionRequirement
  visibility?: PluginWidgetVisibility
  props?: TConfig
}

export interface TenantPluginBinding {
  pluginId: string
  status: PluginStatus
  tenantId?: string
  config?: Record<string, unknown>
}

export interface PluginRuntimeIssue {
  type: 'duplicate_plugin' | 'missing_dependency' | 'circular_dependency' | 'vertical_mismatch'
  pluginId: string
  dependencyId?: string
  message: string
}

export interface PluginManifest {
  id: string
  name: string
  icon: string
  version: string
  scope?: PluginScope
  verticalId?: VerticalId
  tenantId?: string
  defaultEnabled?: boolean
  descriptionNl?: string
  schema?: string
  dependencies?: string[]
  navigation: PluginNavigationEntry[]
  settings?: Array<PluginSettingsTab | LegacyPluginSettingsTab>
  routes: PluginRouteDefinition[]
  widgets?: PluginWidgetDefinition[]
  floatingUI?: {
    component: React.ComponentType
    position: 'bottom-right' | 'bottom-left'
  }[]
  capabilities?: PluginCapability[]
  entities?: string[]
  permissions?: string[]
}

export interface ResolvedPluginManifest extends PluginManifest {
  status: PluginStatus
  isActive: boolean
  activationReason: 'default' | 'tenant' | 'dependency' | 'inactive'
  config: Record<string, unknown>
  missingDependencies: string[]
  settingsTabs: PluginSettingsTab[]
  widgets: PluginWidgetDefinition[]
}

export interface ResolvedPluginWidget<TConfig extends Record<string, unknown> = Record<string, unknown>>
  extends PluginWidgetDefinition<TConfig> {
  order: number
  config: TConfig
  plugin: ResolvedPluginManifest
}

export interface PluginRuntimeRoute extends PluginRouteDefinition {
  plugin: ResolvedPluginManifest
}

export interface PluginRuntime {
  context: PluginRuntimeContext
  plugins: ResolvedPluginManifest[]
  activePlugins: ResolvedPluginManifest[]
  routes: PluginRuntimeRoute[]
  navigation: PluginNavigationEntry[]
  settingsTabs: PluginSettingsTab[]
  widgets: ResolvedPluginWidget[]
  capabilities: PluginCapability[]
  issues: PluginRuntimeIssue[]
}
