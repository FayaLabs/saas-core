import { describe, expect, it } from 'vitest'
import { getWidgetsForZone, resolvePluginRuntime } from './plugins'
import type { PluginManifest } from '../types/plugins'

function createPlugin(overrides: Partial<PluginManifest> & Pick<PluginManifest, 'id' | 'name'>): PluginManifest {
  return {
    id: overrides.id,
    name: overrides.name,
    icon: overrides.icon ?? 'Package',
    version: overrides.version ?? '1.0.0',
    navigation: overrides.navigation ?? [],
    routes: overrides.routes ?? [],
    ...overrides,
  }
}

describe('resolvePluginRuntime', () => {
  it('activates dependency chains from tenant bindings without enabling unrelated plugins', () => {
    const financial = createPlugin({
      id: 'financial',
      name: 'Financial',
      defaultEnabled: false,
    })
    const nfse = createPlugin({
      id: 'nfse',
      name: 'NFSe',
      defaultEnabled: false,
      dependencies: ['financial'],
    })
    const reports = createPlugin({
      id: 'reports',
      name: 'Reports',
      defaultEnabled: false,
    })

    const runtime = resolvePluginRuntime({
      plugins: [nfse, reports, financial],
      tenantPlugins: [{ pluginId: 'nfse', status: 'active' }],
      context: {
        tenant: { id: 'tenant-1', slug: 'tenant-1', verticalId: 'beauty', plan: 'pro' },
        user: { id: 'user-1', role: 'owner' },
        currentPath: '/',
        matchedPath: '/',
        layout: 'sidebar',
      },
    })

    expect(runtime.activePlugins.map((plugin) => plugin.id)).toEqual(['financial', 'nfse'])
    expect(runtime.plugins.find((plugin) => plugin.id === 'financial')?.activationReason).toBe('dependency')
    expect(runtime.plugins.find((plugin) => plugin.id === 'reports')?.isActive).toBe(false)
  })

  it('filters widgets by zone, route, and role', () => {
    const orders = createPlugin({
      id: 'orders',
      name: 'Orders',
      widgets: [
        {
          id: 'orders-summary',
          zone: 'page.before',
          component: () => null,
          visibility: {
            routes: ['/orders/*'],
            roles: ['owner'],
          },
        },
      ],
    })

    const runtime = resolvePluginRuntime({
      plugins: [orders],
      context: {
        tenant: { id: 'tenant-1', slug: 'tenant-1', verticalId: 'food', plan: 'starter' },
        user: { id: 'user-1', role: 'owner' },
        currentPath: '/orders/123',
        matchedPath: '/orders',
        layout: 'sidebar',
      },
    })

    expect(getWidgetsForZone(runtime, 'page.before')).toHaveLength(1)
    expect(getWidgetsForZone(runtime, 'page.before', { currentPath: '/settings' })).toHaveLength(0)
    expect(getWidgetsForZone(runtime, 'page.before', { user: { id: 'user-1', role: 'staff' } })).toHaveLength(0)
  })

  it('does not auto-enable all plugins when tenant bindings are authoritative', () => {
    const financial = createPlugin({
      id: 'financial',
      name: 'Financial',
    })

    const runtime = resolvePluginRuntime({
      plugins: [financial],
      tenantPlugins: [],
      hasTenantBindings: true,
      context: {
        tenant: { id: 'tenant-1', slug: 'tenant-1', verticalId: 'beauty', plan: 'pro' },
        user: { id: 'user-1', role: 'owner' },
        currentPath: '/',
        matchedPath: '/',
        layout: 'sidebar',
      },
    })

    expect(runtime.activePlugins).toHaveLength(0)
  })

  it('records compatibility issues and keeps incompatible plugins inactive', () => {
    const kitchen = createPlugin({
      id: 'kitchen',
      name: 'Kitchen',
      verticalId: 'food',
      defaultEnabled: true,
    })
    const broken = createPlugin({
      id: 'broken',
      name: 'Broken',
      defaultEnabled: true,
      dependencies: ['missing-plugin'],
    })

    const runtime = resolvePluginRuntime({
      plugins: [kitchen, broken],
      context: {
        tenant: { id: 'tenant-1', slug: 'tenant-1', verticalId: 'beauty', plan: 'pro' },
        user: { id: 'user-1', role: 'owner' },
        currentPath: '/',
        matchedPath: '/',
        layout: 'sidebar',
      },
    })

    expect(runtime.plugins.find((plugin) => plugin.id === 'kitchen')?.isActive).toBe(false)
    expect(runtime.plugins.find((plugin) => plugin.id === 'broken')?.isActive).toBe(false)
    expect(runtime.issues.map((issue) => issue.type)).toEqual(
      expect.arrayContaining(['vertical_mismatch', 'missing_dependency']),
    )
  })
})
