import * as React from 'react'
import type {
  PluginCapability,
  PluginManifest,
  PluginNavigationEntry,
  PluginRuntime,
  PluginRuntimeContext,
  PluginRuntimeIssue,
  PluginRuntimeRoute,
  PluginSettingsTab,
  PluginWidgetDefinition,
  PluginWidgetVisibility,
  PluginWidgetZone,
  ResolvedPluginManifest,
  ResolvedPluginWidget,
  TenantPluginBinding,
  PluginRegistryDef,
  PluginAITool,
} from '../types/plugins'

interface ResolvePluginRuntimeOptions {
  plugins?: PluginManifest[]
  tenantPlugins?: TenantPluginBinding[]
  hasTenantBindings?: boolean
  context: PluginRuntimeContext
}

const EMPTY_RUNTIME_CONTEXT: PluginRuntimeContext = {
  tenant: null,
  user: null,
  currentPath: '/',
  matchedPath: '/',
  layout: 'sidebar',
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function matchesRoutePattern(pattern: string, currentPath: string): boolean {
  if (pattern === currentPath) return true
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2)
    return currentPath === base || currentPath.startsWith(`${base}/`)
  }
  if (pattern.endsWith('*')) {
    return currentPath.startsWith(pattern.slice(0, -1))
  }
  return currentPath === pattern
}

function isWidgetVisible(
  widget: ResolvedPluginWidget,
  context: PluginRuntimeContext,
): boolean {
  if (widget.permission && context.hasPermission && !context.hasPermission(widget.permission)) {
    return false
  }

  const visibility: PluginWidgetVisibility | undefined = widget.visibility
  if (!visibility) return true

  if (visibility.layouts && !visibility.layouts.includes(context.layout)) {
    return false
  }

  if (visibility.roles && context.user?.role && !visibility.roles.includes(context.user.role)) {
    return false
  }

  if (visibility.roles && !context.user?.role) {
    return false
  }

  if (visibility.plans && context.tenant?.plan && !visibility.plans.includes(context.tenant.plan)) {
    return false
  }

  if (visibility.plans && !context.tenant?.plan) {
    return false
  }

  if (visibility.routes && !visibility.routes.some((pattern) => matchesRoutePattern(pattern, context.currentPath))) {
    return false
  }

  if (visibility.excludeRoutes?.some((pattern) => matchesRoutePattern(pattern, context.currentPath))) {
    return false
  }

  if (visibility.permissions && visibility.permissions.length > 0) {
    if (!context.hasPermission) return false
    if (!visibility.permissions.every((requirement) => context.hasPermission?.(requirement))) {
      return false
    }
  }

  if (visibility.when && !visibility.when(context)) {
    return false
  }

  return true
}

function normalizeSettingsTabs(plugin: PluginManifest): PluginSettingsTab[] {
  return (plugin.settings ?? []).map((entry, index) => {
    if ('label' in entry && 'id' in entry) {
      return {
        ...entry,
        pluginId: entry.pluginId ?? plugin.id,
        order: entry.order ?? index,
      }
    }

    return {
      id: `${plugin.id}-${slugify(entry.tab)}`,
      label: entry.tab,
      component: entry.component,
      pluginId: plugin.id,
      order: index,
    }
  })
}

function normalizeWidgets(plugin: PluginManifest): PluginWidgetDefinition[] {
  const widgets = [...(plugin.widgets ?? [])]

  if (plugin.floatingUI) {
    widgets.push(
      ...plugin.floatingUI.map((entry, index) => ({
        id: `${plugin.id}-floating-${index}`,
        zone: 'shell.floating' as const,
        component: entry.component,
        order: 1000 + index,
      })),
    )
  }

  return widgets
}

function isPluginCompatible(plugin: PluginManifest, context: PluginRuntimeContext): boolean {
  if (!plugin.verticalId) return true
  return plugin.verticalId === context.tenant?.verticalId
}

function createEmptyRuntime(context: PluginRuntimeContext = EMPTY_RUNTIME_CONTEXT): PluginRuntime {
  return {
    context,
    plugins: [],
    activePlugins: [],
    routes: [],
    navigation: [],
    settingsTabs: [],
    widgets: [],
    capabilities: [],
    aiTools: [],
    registries: new Map(),
    issues: [],
  }
}

export function createPlugin<T extends PluginManifest>(plugin: T): T {
  return plugin
}

export function resolvePluginRuntime({
  plugins = [],
  tenantPlugins = [],
  hasTenantBindings,
  context,
}: ResolvePluginRuntimeOptions): PluginRuntime {
  if (plugins.length === 0) {
    return createEmptyRuntime(context)
  }

  const issues: PluginRuntimeIssue[] = []
  const normalizedPlugins = new Map<string, PluginManifest>()

  for (const plugin of plugins) {
    if (normalizedPlugins.has(plugin.id)) {
      issues.push({
        type: 'duplicate_plugin',
        pluginId: plugin.id,
        message: `Plugin "${plugin.id}" was registered more than once.`,
      })
      continue
    }
    normalizedPlugins.set(plugin.id, plugin)
  }

  const bindings = new Map<string, TenantPluginBinding>()
  for (const binding of tenantPlugins) {
    bindings.set(binding.pluginId, binding)
  }
  const bindingsAreManaged = hasTenantBindings ?? tenantPlugins.length > 0

  const requested = new Set<string>()
  const activationReason = new Map<string, ResolvedPluginManifest['activationReason']>()

  for (const plugin of normalizedPlugins.values()) {
    const binding = bindings.get(plugin.id)
    if (binding?.status === 'active') {
      requested.add(plugin.id)
      activationReason.set(plugin.id, 'tenant')
      continue
    }

    if (plugin.defaultEnabled === true || (!bindingsAreManaged && plugin.defaultEnabled !== false)) {
      requested.add(plugin.id)
      activationReason.set(plugin.id, 'default')
    }
  }

  const orderedIds: string[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(pluginId: string, ancestry: string[] = []): void {
    if (visited.has(pluginId)) return
    const plugin = normalizedPlugins.get(pluginId)
    if (!plugin) return

    if (visiting.has(pluginId)) {
      issues.push({
        type: 'circular_dependency',
        pluginId,
        message: `Circular dependency detected: ${[...ancestry, pluginId].join(' -> ')}.`,
      })
      return
    }

    visiting.add(pluginId)
    for (const dependencyId of plugin.dependencies ?? []) {
      if (!normalizedPlugins.has(dependencyId)) {
        issues.push({
          type: 'missing_dependency',
          pluginId,
          dependencyId,
          message: `Plugin "${plugin.id}" depends on missing plugin "${dependencyId}".`,
        })
        continue
      }

      if (requested.has(pluginId) && !requested.has(dependencyId)) {
        requested.add(dependencyId)
        activationReason.set(dependencyId, 'dependency')
      }

      visit(dependencyId, [...ancestry, pluginId])
    }
    visiting.delete(pluginId)
    visited.add(pluginId)
    orderedIds.push(pluginId)
  }

  for (const pluginId of normalizedPlugins.keys()) {
    visit(pluginId)
  }

  const resolvedById = new Map<string, ResolvedPluginManifest>()

  for (const pluginId of orderedIds) {
    const plugin = normalizedPlugins.get(pluginId)
    if (!plugin) continue

    const binding = bindings.get(plugin.id)
    const missingDependencies = (plugin.dependencies ?? []).filter((dependencyId) => !normalizedPlugins.has(dependencyId))
    const compatible = isPluginCompatible(plugin, context)

    if (!compatible) {
      issues.push({
        type: 'vertical_mismatch',
        pluginId: plugin.id,
        message: `Plugin "${plugin.id}" does not match tenant vertical "${context.tenant?.verticalId ?? 'unknown'}".`,
      })
    }

    const reason = activationReason.get(plugin.id) ?? 'inactive'
    const dependenciesReady = (plugin.dependencies ?? []).every((dependencyId) => resolvedById.get(dependencyId)?.isActive)
    const explicitlyDisabled = binding?.status === 'disabled' || binding?.status === 'removed'
    const shouldAttemptActivation = reason === 'dependency' ? true : requested.has(plugin.id) && !explicitlyDisabled
    const isActive = shouldAttemptActivation && compatible && missingDependencies.length === 0 && dependenciesReady

    resolvedById.set(plugin.id, {
      ...plugin,
      status: isActive ? 'active' : binding?.status ?? 'disabled',
      isActive,
      activationReason: isActive ? reason : 'inactive',
      config: binding?.config ?? {},
      missingDependencies,
      settingsTabs: normalizeSettingsTabs(plugin),
      widgets: normalizeWidgets(plugin),
      resolvedRegistries: plugin.registries ?? [],
      resolvedAITools: plugin.aiTools ?? [],
    })
  }

  const resolvedPlugins = orderedIds
    .map((pluginId) => resolvedById.get(pluginId))
    .filter((plugin): plugin is ResolvedPluginManifest => Boolean(plugin))

  const activePlugins = resolvedPlugins.filter((plugin) => plugin.isActive)
  const routes: PluginRuntimeRoute[] = []
  const navigation: PluginNavigationEntry[] = []
  const settingsTabs: PluginSettingsTab[] = []
  const widgets: ResolvedPluginWidget[] = []
  const capabilities: PluginCapability[] = []
  const aiTools: PluginAITool[] = []
  const registries = new Map<string, PluginRegistryDef[]>()

  for (const plugin of activePlugins) {
    routes.push(...plugin.routes.map((route) => ({ ...route, plugin })))
    navigation.push(
      ...plugin.navigation.map((entry, index) => ({
        ...entry,
        id: entry.id ?? `${plugin.id}:${entry.route}:${index}`,
        icon: entry.icon ?? plugin.icon,
      })),
    )
    settingsTabs.push(...plugin.settingsTabs)
    capabilities.push(...(plugin.capabilities ?? []))
    aiTools.push(...plugin.resolvedAITools)
    if (plugin.resolvedRegistries.length > 0) {
      registries.set(plugin.id, plugin.resolvedRegistries)
    }
    widgets.push(
      ...plugin.widgets.map((widget, index) => ({
        ...widget,
        order: widget.order ?? index,
        config: {
          ...plugin.config,
          ...(widget.props ?? {}),
        },
        plugin,
      })),
    )
  }

  navigation.sort((left, right) => {
    const sectionOrder = { main: 0, secondary: 1, settings: 2 }
    return (sectionOrder[left.section] ?? 99) - (sectionOrder[right.section] ?? 99) || left.position - right.position
  })

  settingsTabs.sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
  widgets.sort((left, right) => {
    if (left.zone !== right.zone) {
      return left.zone.localeCompare(right.zone)
    }
    return left.order - right.order
  })

  return {
    context,
    plugins: resolvedPlugins,
    activePlugins,
    routes,
    navigation,
    settingsTabs,
    widgets,
    capabilities,
    aiTools,
    registries,
    issues,
  }
}

export function getWidgetsForZone(
  runtime: PluginRuntime,
  zone: PluginWidgetZone,
  contextOverrides?: Partial<PluginRuntimeContext>,
): ResolvedPluginWidget[] {
  const context = {
    ...runtime.context,
    ...contextOverrides,
  }

  return runtime.widgets.filter((widget) => widget.zone === zone && isWidgetVisible(widget, context))
}

const PluginRuntimeContext = React.createContext<PluginRuntime | null>(null)

export const PluginRuntimeProvider = PluginRuntimeContext.Provider

export function usePluginRuntimeOptional(): PluginRuntime | null {
  return React.useContext(PluginRuntimeContext)
}

export function usePluginRuntime(): PluginRuntime {
  return React.useContext(PluginRuntimeContext) ?? createEmptyRuntime()
}
