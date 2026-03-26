# @fayz/saas-core

Reusable vertical SaaS foundation. Auth, billing, tenancy, layout, notifications, plugin runtime, and widget slots for building vertical apps from one core.

## Quick Start

```bash
pnpm add @fayz/saas-core
```

```tsx
import { createSaasApp } from '@fayz/saas-core'
import '@fayz/saas-core/styles.css'

const App = createSaasApp({
  name: 'Salao',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  layout: 'sidebar',
  pages: [
    {
      path: '/',
      label: 'Dashboard',
      icon: 'Home',
      component: DashboardPage,
    },
  ],
})

export default App
```

## Plugin Runtime

`saas-core` now resolves plugin navigation, routes, settings tabs, and widgets from a shared runtime.

```tsx
import { createPlugin } from '@fayz/saas-core'

const financialPlugin = createPlugin({
  id: 'financial',
  name: 'Financial',
  icon: 'CreditCard',
  version: '1.0.0',
  navigation: [
    { section: 'main', position: 30, label: 'Financeiro', route: '/financeiro' },
  ],
  routes: [
    { path: '/financeiro', component: FinancialPage },
  ],
  widgets: [
    {
      id: 'cashflow-summary',
      zone: 'page.before',
      component: CashflowSummaryWidget,
      visibility: { routes: ['/financeiro/*', '/financeiro'] },
    },
  ],
})
```

Use `pluginRuntime.tenantPlugins` or `pluginRuntime.resolveTenantPlugins()` to control activation by tenant. Dependencies are activated automatically.

## Widget Zones

Built-in zones:

- `shell.sidebar.before-nav`
- `shell.sidebar.footer`
- `shell.topbar.start`
- `shell.topbar.end`
- `page.before`
- `page.after`
- `settings.before`
- `settings.after`
- `shell.floating`

## Subpath Exports

| Import | Contents |
|--------|----------|
| `@fayz/saas-core` | `createSaasApp()`, core types, config |
| `@fayz/saas-core/components` | All React components |
| `@fayz/saas-core/hooks` | All React hooks |
| `@fayz/saas-core/stores` | All Zustand stores |
| `@fayz/saas-core/server` | Express middleware + services |
| `@fayz/saas-core/config` | Theme, permissions, tailwind preset |
| `@fayz/saas-core/lib` | Utilities (cn, supabase, api) |
| `@fayz/saas-core/types` | TypeScript types |
| `@fayz/saas-core/styles.css` | Base CSS variables |

## Dev Linking

```bash
# In your vertical project:
pnpm add @fayz/saas-core --workspace # or
# package.json: "@fayz/saas-core": "link:../saas-core"
```

See [getting-started.md](./getting-started.md) for full setup guide.
