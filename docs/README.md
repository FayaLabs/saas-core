# @fayz/saas-core

Reusable vertical SaaS foundation. Auth, billing, tenancy, layout, notifications — everything you need to launch a micro-niche SaaS.

## Quick Start

```bash
pnpm add @fayz/saas-core
```

```tsx
import { createSaasApp } from '@fayz/saas-core'
import { AppShell } from '@fayz/saas-core/components'
import '@fayz/saas-core/styles.css'

const { Provider, config } = createSaasApp({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  layout: 'sidebar',
  navigation: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home', route: '/', section: 'main', position: 0 },
    { id: 'settings', label: 'Settings', icon: 'Settings', route: '/settings', section: 'settings', position: 100 },
  ],
})

function App() {
  return (
    <Provider>
      <AppShell variant={config.config.layout || 'sidebar'} navigation={config.config.navigation}>
        {/* Your routes here */}
      </AppShell>
    </Provider>
  )
}
```

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
