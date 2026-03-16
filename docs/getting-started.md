# Getting Started

## Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase project (or local via `supabase start`)
- Stripe account (for billing)

## 1. Install

```bash
pnpm add @fayz/saas-core
```

Or link locally for development:
```json
{
  "dependencies": {
    "@fayz/saas-core": "link:../saas-core"
  }
}
```

## 2. Tailwind Setup

Add the preset to your `tailwind.config.ts`:

```ts
import { saasCoreTailwindPreset } from '@fayz/saas-core/config'

export default {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@fayz/saas-core/dist/**/*.js',
  ],
  presets: [saasCoreTailwindPreset],
  darkMode: 'class',
}
```

Import the base styles in your CSS:
```css
@import '@fayz/saas-core/styles.css';
```

## 3. Supabase Migrations

Copy the core migrations to your project:
```bash
cp node_modules/@fayz/saas-core/supabase/migrations/* supabase/migrations/
supabase db reset
```

## 4. Environment Variables

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 5. Create Your App

```tsx
import { createSaasApp } from '@fayz/saas-core'
import { createTheme } from '@fayz/saas-core/config'

const theme = createTheme({
  name: 'my-vertical',
  colors: {
    primary: '220 70% 50%',
    primaryForeground: '0 0% 100%',
  },
})

const { Provider, config } = createSaasApp({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  theme,
  layout: 'sidebar',
  navigation: [...],
  billing: {
    plans: [
      { id: 'free', name: 'Free', description: 'Get started', features: ['5 clients'], prices: { monthly: 0, yearly: 0 } },
      { id: 'pro', name: 'Pro', description: 'For growing businesses', features: ['Unlimited clients', 'Analytics'], prices: { monthly: 29, yearly: 290 }, popular: true },
    ],
  },
})
```

## 6. Layout

Choose from three built-in layouts:
- **sidebar** — Collapsible sidebar (desktop) + bottom nav (mobile)
- **topbar** — Horizontal nav + hamburger menu (mobile)
- **minimal** — Logo + user menu only

Or pass a custom `React.ComponentType` for full control.
