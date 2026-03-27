import React from 'react'
import { useThemeStore } from './stores/theme.store'
import { useBillingStore } from './stores/billing.store'
import { useAuthStore } from './stores/auth.store'
import { usePermissionsStore } from './stores/permissions.store'
import { createSupabaseClient } from './lib/supabase'
import { ToastProvider } from './components/notifications/ToastProvider'
import { RouterProvider, setGlobalRouter, hashRouterAdapter, type RouterAdapter } from './lib/router'
import { AppShell } from './components/layout/AppShell'
import { WidgetSlot } from './components/plugins/WidgetSlot'
import { SettingsPage } from './components/settings/SettingsPage'
import { BillingPage } from './components/billing/BillingPage'
import { ChatFab } from './components/chat/ChatFab'
import { ChatPanel } from './components/chat/ChatPanel'
import { CommandPalette, type CommandItem } from './components/layout/CommandPalette'
import { useLayoutStore } from './stores/layout.store'
import { LoginPage } from './components/auth/LoginPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AuthAdapterProvider } from './lib/auth-context'
import { OrgAdapterProvider } from './lib/org-context'
import { createMockAuthAdapter } from './lib/auth-adapters/mock'
import { createSupabaseAuthAdapter } from './lib/auth-adapters/supabase'
import { createMockOrgAdapter } from './lib/org-adapters/mock'
import { createSupabaseOrgAdapter } from './lib/org-adapters/supabase'
import { OrgSwitcher } from './components/organization/OrgSwitcher'
import { OrgInitializer } from './components/organization/OrgInitializer'
import { PermissionGate } from './components/organization/PermissionGate'
import { TeamTab } from './components/organization/TeamTab'
import { PermissionProfilesTab } from './components/organization/PermissionProfilesTab'
import { resolvePluginRuntime, PluginRuntimeProvider } from './lib/plugins'
import type { AuthAdapter } from './types/auth-adapter'
import type { OrgAdapter } from './types/org-adapter'
import type { NavigationItem } from './types/layout'
import type { Plan } from './types/billing'
import type {
  PluginManifest,
  PluginPermissionRequirement,
  ResolvedPluginManifest,
  PluginSettingsTab,
  TenantPluginBinding,
} from './types/plugins'
import type { CreateThemeOptions } from './config/theme/utils'
import { resolveTheme } from './config/theme/utils'
import type { SaasTheme } from './config/theme/tokens'
import type { AuthProvider } from './types/auth'
import type { PermissionsConfig, PermissionAction } from './types/permissions'
import { useOrganizationStore } from './stores/organization.store'
import { usePermission } from './hooks/usePermission'
import { useTenantPlugins } from './hooks/useTenantPlugins'

// ---------------------------------------------------------------------------
// Page config — unifies navigation + routing in one declaration
// ---------------------------------------------------------------------------
export interface PageConfig {
  /** URL path, e.g. '/' or '/clients' */
  path: string
  /** Sidebar/nav label */
  label: string
  /** Lucide icon name */
  icon: string
  /** The page component to render */
  component: React.ComponentType
  /** Navigation section (default: 'main') */
  section?: 'main' | 'secondary' | 'settings'
  /** Sort order within section (auto-incremented if omitted) */
  position?: number
  /** Optional badge */
  badge?: string | number
  /** Permission required to access this page */
  permission?: { feature: string; action: PermissionAction }
  /** Child pages — renders as a dropdown in topbar, collapsible in sidebar.
   *  Children can omit `component` to be navigation-only links (pointing to routes the parent handles). */
  children?: Array<Omit<PageConfig, 'component'> & { component?: React.ComponentType }>
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
export interface SaasAppConfig {
  /** App display name (used in sidebar header) */
  name: string
  /** Logo — string renders as initial badge, ReactNode renders as-is */
  logo?: string | React.ReactNode
  /** Supabase project URL — one project per SaaS (core in saas_core schema, data in public) */
  supabaseUrl?: string
  /** Supabase anon key */
  supabaseAnonKey?: string
  /** Theme overrides — use SaasTheme (friendly) or CreateThemeOptions (granular) */
  theme?: CreateThemeOptions | SaasTheme
  /** Default theme mode: 'light' or 'dark'. User can toggle. Default: 'light' */
  defaultThemeMode?: 'light' | 'dark'
  /** Layout variant (default: 'sidebar') */
  layout?: 'sidebar' | 'topbar' | 'minimal'
  /** Content floats in a rounded frame over the sidebar background (default: true). Set false to disable. */
  sidebarFrame?: boolean
  /** Vertical-specific pages */
  pages: PageConfig[]
  /** Plugins to register */
  plugins?: PluginManifest[]
  /** Runtime plugin activation for tenant-aware apps */
  pluginRuntime?: {
    tenantPlugins?: TenantPluginBinding[]
    resolveTenantPlugins?: (context: {
      tenant: { id: string; slug: string; verticalId?: string; plan?: string } | null
      user: { id: string } | null
    }) => TenantPluginBinding[] | undefined
  }
  /** Router adapter (default: hashRouterAdapter) */
  router?: RouterAdapter
  /** Billing configuration */
  billing?: {
    plans: Plan[]
    stripePublishableKey?: string
  }
  /** AI chat configuration */
  chat?: {
    enabled?: boolean
    systemPrompt?: string
    apiEndpoint?: string
    title?: string
  }
  /** Notification configuration */
  notifications?: {
    changelogUrl?: string
  }
  /** Locale / i18n configuration */
  locale?: {
    default?: string
    supported?: string[]
    translations?: Record<string, Record<string, string>>
  }
  /** Mock user for demo/dev (will be replaced by auth in production) */
  user?: {
    fullName: string
    email: string
    avatarUrl?: string
  }
  /** Auth configuration */
  auth?: {
    adapter?: AuthAdapter | 'mock' | 'supabase'
    requireAuth?: boolean
    loginLogo?: React.ReactNode
    loginLayout?: 'split' | 'centered'
    loginTagline?: string
    loginDescription?: string
    showOAuth?: boolean
    oauthProviders?: Exclude<AuthProvider, 'email'>[]
  }
  /** Organization / multi-tenant configuration */
  organization?: {
    adapter?: OrgAdapter | 'mock' | 'supabase'
    multiOrg?: boolean
  }
  /** Vertical/niche ID — auto-set on tenant creation, skips niche selection in onboarding */
  verticalId?: string
  /** Permission profiles configuration */
  permissions?: PermissionsConfig
  /** Additional settings tabs to merge with built-in ones */
  settingsTabs?: { id: string; label: string; component: React.ReactNode }[]
  /** Set to false to hide built-in Settings page (default: true) */
  showSettings?: boolean
  /** Set to false to hide built-in Billing page (default: true when plans provided) */
  showBilling?: boolean
}

// ---------------------------------------------------------------------------
// Internal: build NavigationItem[] from PageConfig[] + built-ins
// ---------------------------------------------------------------------------
type RouteEntry = {
  component: React.ComponentType<any>
  permission?: PluginPermissionRequirement
  plugin?: ResolvedPluginManifest
}

function sortNavigation(
  navigation: (NavigationItem & { permission?: PluginPermissionRequirement })[],
): (NavigationItem & { permission?: PluginPermissionRequirement })[] {
  return [...navigation].sort((a, b) => {
    const sectionOrder = { main: 0, secondary: 1, settings: 2 }
    const sa = sectionOrder[a.section] ?? 1
    const sb = sectionOrder[b.section] ?? 1
    if (sa !== sb) return sa - sb
    return a.position - b.position
  })
}

function buildNavigation(
  pages: PageConfig[],
  config: SaasAppConfig
): { navigation: (NavigationItem & { permission?: PluginPermissionRequirement })[]; routes: Map<string, RouteEntry> } {
  const navigation: (NavigationItem & { permission?: PluginPermissionRequirement })[] = []
  const routes = new Map<string, RouteEntry>()

  // Vertical pages
  let mainPos = 0
  let secondaryPos = 0
  for (const page of pages) {
    const section = page.section ?? 'main'
    const position = page.position ?? (section === 'main' ? mainPos++ : secondaryPos++)

    // Build child navigation items + routes
    const childNavItems: NavigationItem[] = []
    if (page.children) {
      for (const child of page.children) {
        childNavItems.push({
          id: child.path.slice(1).replace(/\//g, '-'),
          label: child.label,
          icon: child.icon,
          route: child.path,
          section,
          position: 0,
          badge: child.badge,
        })
        // Only register route if child has its own component and path isn't already handled
        if (child.component && !routes.has(child.path)) {
          if ((child.component as any)?.__isCrudPage) {
            ;(child.component as any).__crudBasePath = child.path
          }
          routes.set(child.path, { component: child.component, permission: child.permission })
        }
      }
    }

    navigation.push({
      id: page.path === '/' ? 'home' : page.path.slice(1).replace(/\//g, '-'),
      label: page.label,
      icon: page.icon,
      route: page.path,
      section,
      position,
      badge: page.badge,
      permission: page.permission,
      ...(childNavItems.length > 0 ? { children: childNavItems } : {}),
    })
    // Set basePath on CRUD pages so they know their mount point
    if ((page.component as any)?.__isCrudPage) {
      ;(page.component as any).__crudBasePath = page.path
    }
    routes.set(page.path, { component: page.component, permission: page.permission })
  }

  // Built-in Billing page (route exists but no sidebar nav item — accessed via user dropdown)
  const showBilling = config.showBilling ?? (config.billing?.plans && config.billing.plans.length > 0)
  if (showBilling) {
    routes.set('/billing', { component: BillingPage })
  }

  // Built-in Settings page (route exists but no sidebar nav item — accessed via user dropdown)
  const showSettings = config.showSettings !== false
  if (showSettings) {
    routes.set('/settings', { component: SettingsPage })
  }

  return { navigation: sortNavigation(navigation), routes }
}

// ---------------------------------------------------------------------------
// Internal: render logo from string or ReactNode
// ---------------------------------------------------------------------------
function CommandPaletteWrapper({ navigation, routerAdapter }: { navigation: NavigationItem[]; routerAdapter: RouterAdapter }) {
  const { commandPaletteOpen, setCommandPaletteOpen } = useLayoutStore()

  const commands: CommandItem[] = React.useMemo(() => {
    const items: CommandItem[] = []
    for (const nav of navigation) {
      items.push({
        id: nav.id,
        label: nav.label,
        icon: nav.icon,
        group: 'Pages',
        action: () => routerAdapter.navigate(nav.route),
      })
      if ((nav as any).children) {
        for (const child of (nav as any).children) {
          items.push({
            id: child.id,
            label: child.label,
            icon: child.icon,
            group: nav.label,
            action: () => routerAdapter.navigate(child.route),
          })
        }
      }
    }
    // System actions
    items.push(
      { id: 'settings', label: 'Settings', icon: 'Settings', group: 'System', action: () => routerAdapter.navigate('/settings') },
      { id: 'billing', label: 'Billing', icon: 'CreditCard', group: 'System', action: () => routerAdapter.navigate('/billing') },
    )
    return items
  }, [navigation, routerAdapter])

  return React.createElement(CommandPalette, {
    commands,
    open: commandPaletteOpen,
    onOpenChange: setCommandPaletteOpen,
  })
}

function renderLogo(name: string, logo?: string | React.ReactNode): React.ReactNode {
  if (logo && typeof logo !== 'string') return logo
  const initial = typeof logo === 'string' ? logo : name.charAt(0).toUpperCase()
  return React.createElement('div', { className: 'flex items-center gap-3' },
    React.createElement('div', {
      className: 'w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm',
    }, initial),
    React.createElement('span', { className: 'font-bold text-lg' }, name),
  )
}

// ---------------------------------------------------------------------------
// Internal: resolve auth adapter from config
// ---------------------------------------------------------------------------
function resolveAuthAdapter(config: SaasAppConfig): AuthAdapter | null {
  if (!config.auth?.adapter) return null
  if (typeof config.auth.adapter === 'object') return config.auth.adapter
  if (config.auth.adapter === 'mock') return createMockAuthAdapter()
  if (config.auth.adapter === 'supabase') {
    return createSupabaseAuthAdapter()
  }
  return null
}

// ---------------------------------------------------------------------------
// Internal: resolve org adapter from config
// ---------------------------------------------------------------------------
function resolveOrgAdapter(config: SaasAppConfig): OrgAdapter | null {
  if (!config.organization?.adapter) return null
  if (typeof config.organization.adapter === 'object') return config.organization.adapter
  if (config.organization.adapter === 'mock') {
    return createMockOrgAdapter(config.permissions?.defaultProfiles)
  }
  if (config.organization.adapter === 'supabase') {
    return createSupabaseOrgAdapter()
  }
  return null
}

function buildSettingsTabs(
  config: SaasAppConfig,
  pluginTabs: PluginSettingsTab[],
  can: (feature: string, action: PermissionAction) => boolean,
): { id: string; label: string; component: React.ReactNode }[] {
  const settingsTabs: { id: string; label: string; component: React.ReactNode }[] = []

  if (config.organization) {
    settingsTabs.push(
      { id: 'team', label: 'Team', component: React.createElement(TeamTab) },
      { id: 'permissions', label: 'Permissions', component: React.createElement(PermissionProfilesTab) },
    )
  }

  if (config.settingsTabs) {
    settingsTabs.push(...config.settingsTabs)
  }

  for (const tab of pluginTabs) {
    if (tab.permission && !can(tab.permission.feature, tab.permission.action)) {
      continue
    }

    settingsTabs.push({
      id: tab.id,
      label: tab.label,
      component: React.createElement(tab.component),
    })
  }

  return settingsTabs
}

// ---------------------------------------------------------------------------
// createSaasApp — returns a ready-to-render App component
// ---------------------------------------------------------------------------
export function createSaasApp(config: SaasAppConfig): React.FC {
  // Initialize Supabase — single project, core tables in saas_core schema
  if (config.supabaseUrl && config.supabaseAnonKey) {
    createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey)
  }

  const routerAdapter = config.router ?? hashRouterAdapter()
  setGlobalRouter(routerAdapter)

  const { navigation: baseNavigation, routes: baseRoutes } = buildNavigation(config.pages, config)
  const layout = config.layout ?? 'sidebar'
  const logoNode = renderLogo(config.name, config.logo)

  // Resolve adapters at creation time
  const authAdapter = resolveAuthAdapter(config)
  const orgAdapter = resolveOrgAdapter(config)
  const requireAuth = config.auth?.requireAuth ?? !!authAdapter

  // Login page component
  const LoginPageWrapper: React.FC = () => {
    return React.createElement(LoginPage, {
      appName: config.name,
      logo: config.auth?.loginLogo ?? logoNode,
      layout: config.auth?.loginLayout ?? 'split',
      tagline: config.auth?.loginTagline,
      description: config.auth?.loginDescription,
      showOAuth: config.auth?.showOAuth,
      oauthProviders: config.auth?.oauthProviders,
      onSuccess: () => { routerAdapter.navigate('/') },
    })
  }

  // The inner app (authenticated content)
  const AppContent: React.FC = () => {
    const route = routerAdapter.usePathname()
    const authUser = useAuthStore((s) => s.user)
    const currentOrg = useOrganizationStore((s) => s.currentOrg)
    const currentProfile = usePermissionsStore((s) => s.currentProfile)
    const { can } = usePermission()
    const { tenantPlugins: hydratedTenantPlugins } = useTenantPlugins()

    // Derive display user from auth or config fallback
    const user = authUser
      ? { fullName: authUser.fullName, email: authUser.email, avatarUrl: authUser.avatarUrl }
      : config.user

    // If we're on the login route, render login page
    if (route === '/login') {
      return React.createElement(LoginPageWrapper)
    }

    const tenantPluginBindings = config.pluginRuntime?.resolveTenantPlugins?.({
      tenant: currentOrg
        ? {
            id: currentOrg.id,
            slug: currentOrg.slug,
            verticalId: currentOrg.verticalId,
            plan: currentOrg.plan,
          }
        : null,
      user: authUser ? { id: authUser.id } : null,
    }) ?? config.pluginRuntime?.tenantPlugins ?? hydratedTenantPlugins
    const usesHydratedTenantBindings = !config.pluginRuntime?.resolveTenantPlugins && !config.pluginRuntime?.tenantPlugins && !!currentOrg

    const initialPluginRuntime = resolvePluginRuntime({
      plugins: config.plugins,
      tenantPlugins: tenantPluginBindings,
      hasTenantBindings: usesHydratedTenantBindings ? true : undefined,
      context: {
        tenant: currentOrg
          ? {
              id: currentOrg.id,
              slug: currentOrg.slug,
              verticalId: currentOrg.verticalId,
              plan: currentOrg.plan,
            }
          : null,
        user: authUser
          ? {
              id: authUser.id,
              role: currentProfile?.id,
            }
          : null,
        currentPath: route,
        matchedPath: route,
        layout,
        hasPermission: (requirement) => can(requirement.feature, requirement.action),
      },
    })

    const navigation = sortNavigation([
      ...baseNavigation,
      ...initialPluginRuntime.navigation.map((item) => ({
        id: item.id ?? item.route,
        label: item.label,
        icon: item.icon ?? 'Package',
        route: item.route,
        section: item.section,
        position: item.position,
        badge: item.badge,
        permission: item.permission,
      })),
    ])
    const routes = new Map(baseRoutes)
    for (const pluginRoute of initialPluginRuntime.routes) {
      routes.set(pluginRoute.path, {
        component: pluginRoute.component,
        permission: pluginRoute.permission,
        plugin: pluginRoute.plugin,
      })
    }

    // Resolve page: exact match first, then prefix match for CRUD sub-routes
    let matchedPath = route
    let routeEntry = routes.get(route)
    if (!routeEntry) {
      // Try prefix match (e.g. /services/new → /services)
      for (const [path, entry] of routes) {
        if (path !== '/' && route.startsWith(path + '/') && (entry.component as any).__isCrudPage) {
          routeEntry = entry
          matchedPath = path
          break
        }
      }
    }
    const pluginRuntime = {
      ...initialPluginRuntime,
      context: {
        ...initialPluginRuntime.context,
        matchedPath,
      },
    }
    const PageComponent = routeEntry?.component ?? routes.get('/')?.component ?? (() => null)
    const pagePermission = routeEntry?.permission
    const pageTitle = navigation.find((n) => n.route === matchedPath)?.label ?? navigation.find((n) => n.route === route)?.label ?? navigation[0]?.label ?? ''
    const settingsTabs = buildSettingsTabs(config, pluginRuntime.settingsTabs, can)

    const handleSignOut = async () => {
      if (authAdapter) {
        try {
          await authAdapter.signOut()
          useAuthStore.getState().reset()
          useAuthStore.getState().setInitialized(true)
        } catch {
          // ignore sign out errors
        }
        routerAdapter.navigate('/login')
      }
    }

    const renderedPage = matchedPath === '/settings' && config.showSettings !== false
      ? React.createElement(SettingsPage, {
          extraTabs: settingsTabs,
          beforeContent: React.createElement(WidgetSlot, {
            zone: 'settings.before',
            className: 'space-y-4',
            contextOverrides: { matchedPath },
          }),
          afterContent: React.createElement(WidgetSlot, {
            zone: 'settings.after',
            className: 'space-y-4',
            contextOverrides: { matchedPath },
          }),
        })
      : React.createElement(PageComponent, routeEntry?.plugin ? {
          plugin: routeEntry.plugin,
          runtime: pluginRuntime.context,
          config: routeEntry.plugin.config,
        } : undefined)

    // Build page element — wrap in PermissionGate if page has permission config
    const pageContent = React.createElement('div', { key: matchedPath, className: 'saas-page-enter space-y-6' },
      React.createElement(WidgetSlot, {
        zone: 'page.before',
        className: 'space-y-4',
        contextOverrides: { matchedPath },
      }),
      renderedPage,
      React.createElement(WidgetSlot, {
        zone: 'page.after',
        className: 'space-y-4',
        contextOverrides: { matchedPath },
      }),
    )
    const pageElement: React.ReactNode = pagePermission
      ? React.createElement(
          PermissionGate,
          {
            feature: pagePermission.feature,
            action: pagePermission.action,
            fallback: React.createElement('div', { className: 'flex items-center justify-center py-24' },
              React.createElement('div', { className: 'text-center' },
                React.createElement('h2', { className: 'text-xl font-semibold mb-2' }, 'Access Denied'),
                React.createElement('p', { className: 'text-muted-foreground' }, 'You don\'t have permission to view this page.')
              )
            ),
            children: pageContent,
          },
        )
      : pageContent

    // Build orgSwitcher if configured
    const orgSwitcherElement = orgAdapter
      ? React.createElement(OrgSwitcher)
      : undefined

    const content = React.createElement(
      PluginRuntimeProvider,
      { value: pluginRuntime },
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          AppShell,
          {
            variant: layout,
            sidebarFrame: config.sidebarFrame !== false,
            navigation,
            user,
            pageTitle: undefined,
            currentPath: matchedPath,
            onNavigate: (path: string) => { routerAdapter.navigate(path) },
            onSignOut: authAdapter ? handleSignOut : () => console.log('sign out'),
            onProfile: () => { routerAdapter.navigate('/settings') },
            onSettings: () => { routerAdapter.navigate('/settings') },
            onBilling: routes.has('/billing') ? () => { routerAdapter.navigate('/billing') } : undefined,
            logo: logoNode,
            orgSwitcher: orgSwitcherElement,
            topbarStart: React.createElement(WidgetSlot, {
              zone: 'shell.topbar.start',
              className: 'flex items-center gap-2',
              contextOverrides: { matchedPath },
            }),
            topbarEnd: React.createElement(WidgetSlot, {
              zone: 'shell.topbar.end',
              className: 'flex items-center gap-2',
              contextOverrides: { matchedPath },
            }),
            sidebarTopContent: React.createElement(WidgetSlot, {
              zone: 'shell.sidebar.before-nav',
              className: 'space-y-2',
              contextOverrides: { matchedPath },
            }),
            sidebarFooterContent: React.createElement(WidgetSlot, {
              zone: 'shell.sidebar.footer',
              className: 'space-y-2',
              contextOverrides: { matchedPath },
            }),
          },
          pageElement,
        ),
        // Org initializer
        orgAdapter ? React.createElement(OrgInitializer, { verticalId: config.verticalId }) : null,
        // Chat
        config.chat?.enabled !== false && config.chat
          ? React.createElement(React.Fragment, null,
              React.createElement(ChatFab),
              React.createElement(ChatPanel, { title: config.chat.title }),
            )
          : null,
        React.createElement(WidgetSlot, {
          zone: 'shell.floating',
          contextOverrides: { matchedPath },
        }),
        // Command palette
        React.createElement(CommandPaletteWrapper, { navigation, routerAdapter }),
      ),
    )

    // Wrap in ProtectedRoute if auth is required
    if (requireAuth && authAdapter) {
      return React.createElement(
        ProtectedRoute,
        { onUnauthenticated: () => { routerAdapter.navigate('/login') } },
        content,
      )
    }

    return content
  }

  // The full App component
  const SaasApp: React.FC = () => {
    const initialize = useThemeStore((s) => s.initialize)
    const setOverrides = useThemeStore((s) => s.setOverrides)
    const setPlans = useBillingStore((s) => s.setPlans)
    const setFeatures = usePermissionsStore((s) => s.setFeatures)

    const setMode = useThemeStore((s) => s.setMode)

    React.useEffect(() => {
      if (config.theme) {
        const isSaasTheme = 'brand' in config.theme && ('radius' in config.theme || 'sidebar' in config.theme || 'font' in config.theme)
        const resolved = isSaasTheme ? resolveTheme(config.theme as SaasTheme) : config.theme as CreateThemeOptions
        setOverrides(resolved)
      }
      // Set default mode if no user preference saved
      if (config.defaultThemeMode && !localStorage.getItem('saas-core:theme-mode')) {
        setMode(config.defaultThemeMode)
      }
      initialize()
    }, [initialize, setOverrides, setMode])

    React.useEffect(() => {
      if (config.billing?.plans) {
        setPlans(config.billing.plans)
      }
    }, [setPlans])

    // Initialize permissions config
    React.useEffect(() => {
      if (config.permissions?.features) {
        setFeatures(config.permissions.features)
      }
    }, [setFeatures])

    let inner: React.ReactNode = React.createElement(
      RouterProvider,
      { value: routerAdapter },
      React.createElement(ToastProvider, null),
      React.createElement(AppContent),
    )

    // Wrap in OrgAdapterProvider if adapter is configured
    if (orgAdapter) {
      inner = React.createElement(
        OrgAdapterProvider,
        { value: orgAdapter, children: inner },
      )
    }

    // Wrap in AuthAdapterProvider if adapter is configured
    if (authAdapter) {
      inner = React.createElement(
        AuthAdapterProvider,
        { value: authAdapter, children: inner },
      )
    }

    return inner as React.JSX.Element
  }

  return SaasApp
}

// Re-export everything
export * from './types'
export * from './config'
export * from './lib'
export { createCrudPage } from './components/crud/createCrudPage'
export { createCrudStore } from './stores/createCrudStore'
export { PermissionGate } from './components/organization/PermissionGate'
export { usePermission } from './hooks/usePermission'
