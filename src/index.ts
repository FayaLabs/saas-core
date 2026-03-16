import React from 'react'
import { useThemeStore } from './stores/theme.store'
import { useBillingStore } from './stores/billing.store'
import { useAuthStore } from './stores/auth.store'
import { usePermissionsStore } from './stores/permissions.store'
import { createSupabaseClient } from './lib/supabase'
import { ToastProvider } from './components/notifications/ToastProvider'
import { RouterProvider, setGlobalRouter, hashRouterAdapter, type RouterAdapter } from './lib/router'
import { AppShell } from './components/layout/AppShell'
import { SettingsPage } from './components/settings/SettingsPage'
import { BillingPage } from './components/billing/BillingPage'
import { ChatFab } from './components/chat/ChatFab'
import { ChatPanel } from './components/chat/ChatPanel'
import { LoginPage } from './components/auth/LoginPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AuthAdapterProvider } from './lib/auth-context'
import { OrgAdapterProvider } from './lib/org-context'
import { createMockAuthAdapter } from './lib/auth-adapters/mock'
import { createSupabaseAuthAdapter } from './lib/auth-adapters/supabase'
import { createMockOrgAdapter } from './lib/org-adapters/mock'
import { OrgSwitcher } from './components/organization/OrgSwitcher'
import { OrgInitializer } from './components/organization/OrgInitializer'
import { PermissionGate } from './components/organization/PermissionGate'
import { TeamTab } from './components/organization/TeamTab'
import { PermissionProfilesTab } from './components/organization/PermissionProfilesTab'
import type { AuthAdapter } from './types/auth-adapter'
import type { OrgAdapter } from './types/org-adapter'
import type { ThemeTokens } from './config/theme/tokens'
import type { NavigationItem } from './types/layout'
import type { Plan } from './types/billing'
import type { PluginManifest } from './types/plugins'
import type { CreateThemeOptions } from './config/theme/utils'
import type { AuthProvider } from './types/auth'
import type { PermissionsConfig, PermissionAction } from './types/permissions'

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
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
export interface SaasAppConfig {
  /** App display name (used in sidebar header) */
  name: string
  /** Logo — string renders as initial badge, ReactNode renders as-is */
  logo?: string | React.ReactNode
  /** Supabase project URL */
  supabaseUrl?: string
  /** Supabase anon key */
  supabaseAnonKey?: string
  /** Theme overrides — use `brand` shorthand or granular colors/perception */
  theme?: CreateThemeOptions
  /** Layout variant (default: 'sidebar') */
  layout?: 'sidebar' | 'topbar' | 'minimal'
  /** Vertical-specific pages */
  pages: PageConfig[]
  /** Plugins to register */
  plugins?: PluginManifest[]
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
    showOAuth?: boolean
    oauthProviders?: Exclude<AuthProvider, 'email'>[]
  }
  /** Organization / multi-tenant configuration */
  organization?: {
    adapter?: OrgAdapter | 'mock' | 'supabase'
    multiOrg?: boolean
  }
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
function buildNavigation(
  pages: PageConfig[],
  config: SaasAppConfig
): { navigation: (NavigationItem & { permission?: { feature: string; action: PermissionAction } })[]; routes: Map<string, { component: React.ComponentType; permission?: { feature: string; action: PermissionAction } }> } {
  const navigation: (NavigationItem & { permission?: { feature: string; action: PermissionAction } })[] = []
  const routes = new Map<string, { component: React.ComponentType; permission?: { feature: string; action: PermissionAction } }>()

  // Vertical pages
  let mainPos = 0
  let secondaryPos = 0
  for (const page of pages) {
    const section = page.section ?? 'main'
    const position = page.position ?? (section === 'main' ? mainPos++ : secondaryPos++)
    navigation.push({
      id: page.path === '/' ? 'home' : page.path.slice(1),
      label: page.label,
      icon: page.icon,
      route: page.path,
      section,
      position,
      badge: page.badge,
      permission: page.permission,
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
    // Build settings tabs: default + org tabs (if configured) + custom
    const settingsTabs: { id: string; label: string; component: React.ReactNode }[] = []

    // Auto-inject Team and Permissions tabs when org is configured
    if (config.organization) {
      settingsTabs.push(
        { id: 'team', label: 'Team', component: React.createElement(TeamTab) },
        { id: 'permissions', label: 'Permissions', component: React.createElement(PermissionProfilesTab) },
      )
    }

    // Add user's custom tabs
    if (config.settingsTabs) {
      settingsTabs.push(...config.settingsTabs)
    }

    const SettingsWithTabs: React.FC = () =>
      React.createElement(SettingsPage, { tabs: settingsTabs.length > 0 ? undefined : undefined, extraTabs: settingsTabs })
    // SettingsPage doesn't have extraTabs — we merge into tabs prop
    const mergedSettingsComponent: React.FC = () =>
      React.createElement(SettingsPage, settingsTabs.length > 0 ? { extraTabs: settingsTabs } : undefined)

    routes.set('/settings', { component: mergedSettingsComponent })
  }

  // Plugin navigation
  if (config.plugins) {
    for (const plugin of config.plugins) {
      for (const nav of plugin.navigation) {
        navigation.push({
          id: `${plugin.id}-${nav.route}`,
          label: nav.label,
          icon: plugin.icon,
          route: nav.route,
          section: nav.section,
          position: nav.position,
        })
      }
    }
  }

  navigation.sort((a, b) => {
    const sectionOrder = { main: 0, secondary: 1, settings: 2 }
    const sa = sectionOrder[a.section] ?? 1
    const sb = sectionOrder[b.section] ?? 1
    if (sa !== sb) return sa - sb
    return a.position - b.position
  })

  return { navigation, routes }
}

// ---------------------------------------------------------------------------
// Internal: render logo from string or ReactNode
// ---------------------------------------------------------------------------
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
  // TODO: supabase org adapter
  return null
}

// ---------------------------------------------------------------------------
// createSaasApp — returns a ready-to-render App component
// ---------------------------------------------------------------------------
export function createSaasApp(config: SaasAppConfig): React.FC {
  // Initialize Supabase if credentials provided
  if (config.supabaseUrl && config.supabaseAnonKey) {
    createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey)
  }

  const routerAdapter = config.router ?? hashRouterAdapter()
  setGlobalRouter(routerAdapter)

  const { navigation, routes } = buildNavigation(config.pages, config)
  const layout = config.layout ?? 'sidebar'
  const logoNode = renderLogo(config.name, config.logo)

  // Resolve adapters at creation time
  const authAdapter = resolveAuthAdapter(config)
  const orgAdapter = resolveOrgAdapter(config)
  const requireAuth = config.auth?.requireAuth ?? !!authAdapter

  // Collect floatingUI from plugins
  const floatingUI: { component: React.ComponentType; position: string }[] = []
  if (config.plugins) {
    for (const plugin of config.plugins) {
      if (plugin.floatingUI) {
        floatingUI.push(...plugin.floatingUI)
      }
    }
  }

  // The internal router hook for hash-based routing
  function useHashRoute() {
    const [route, setRoute] = React.useState(window.location.hash.slice(1) || '/')
    React.useEffect(() => {
      const handler = () => setRoute(window.location.hash.slice(1) || '/')
      window.addEventListener('hashchange', handler)
      return () => window.removeEventListener('hashchange', handler)
    }, [])
    return route
  }

  // Login page component
  const LoginPageWrapper: React.FC = () => {
    return React.createElement(LoginPage, {
      appName: config.name,
      logo: config.auth?.loginLogo ?? logoNode,
      showOAuth: config.auth?.showOAuth,
      oauthProviders: config.auth?.oauthProviders,
      onSuccess: () => { window.location.hash = '/' },
    })
  }

  // The inner app (authenticated content)
  const AppContent: React.FC = () => {
    const route = useHashRoute()
    const authUser = useAuthStore((s) => s.user)

    // Derive display user from auth or config fallback
    const user = authUser
      ? { fullName: authUser.fullName, email: authUser.email, avatarUrl: authUser.avatarUrl }
      : config.user

    // If we're on the login route, render login page
    if (route === '/login') {
      return React.createElement(LoginPageWrapper)
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
    const PageComponent = routeEntry?.component ?? routes.get('/')?.component ?? (() => null)
    const pagePermission = routeEntry?.permission
    const pageTitle = navigation.find((n) => n.route === matchedPath)?.label ?? navigation.find((n) => n.route === route)?.label ?? navigation[0]?.label ?? ''

    const handleSignOut = async () => {
      if (authAdapter) {
        try {
          await authAdapter.signOut()
          useAuthStore.getState().reset()
          useAuthStore.getState().setInitialized(true)
        } catch {
          // ignore sign out errors
        }
        window.location.hash = '/login'
      }
    }

    // Build page element — wrap in PermissionGate if page has permission config
    const pageContent = React.createElement('div', { className: 'p-4 md:p-6' },
      React.createElement(PageComponent)
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
      React.Fragment,
      null,
      React.createElement(
        AppShell,
        {
          variant: layout,
          navigation,
          user,
          pageTitle,
          currentPath: matchedPath,
          onNavigate: (path: string) => { window.location.hash = path },
          onSignOut: authAdapter ? handleSignOut : () => console.log('sign out'),
          onProfile: () => { window.location.hash = '/settings' },
          onSettings: () => { window.location.hash = '/settings' },
          onBilling: routes.has('/billing') ? () => { window.location.hash = '/billing' } : undefined,
          logo: logoNode,
          orgSwitcher: orgSwitcherElement,
        },
        pageElement,
      ),
      // Org initializer
      orgAdapter ? React.createElement(OrgInitializer) : null,
      // Chat
      config.chat?.enabled !== false && config.chat
        ? React.createElement(React.Fragment, null,
            React.createElement(ChatFab),
            React.createElement(ChatPanel, { title: config.chat.title }),
          )
        : null,
      // Plugin floating UI
      ...floatingUI.map((ui, i) =>
        React.createElement(ui.component, { key: `floating-${i}` })
      )
    )

    // Wrap in ProtectedRoute if auth is required
    if (requireAuth && authAdapter) {
      return React.createElement(
        ProtectedRoute,
        { onUnauthenticated: () => { window.location.hash = '/login' } },
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

    React.useEffect(() => {
      if (config.theme) {
        setOverrides(config.theme)
      }
      initialize()
    }, [initialize, setOverrides])

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
