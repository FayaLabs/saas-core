# Architecture

## Package Structure

Single package with subpath exports. No monorepo complexity.

```
src/
├── index.ts              # createSaasApp() entry point
├── components/           # React components by feature
├── hooks/                # React hooks
├── stores/               # Zustand stores
├── server/               # Express middleware + services
├── config/               # Theme, permissions, tailwind
├── lib/                  # Utilities
├── types/                # TypeScript types
└── styles.css            # CSS variables
```

## Key Patterns

### Supabase-Native
All auth, database, and realtime features use Supabase. RLS enforces tenant isolation at the database level.

### Tenant Isolation
- Each tenant identified by `tenant_id` in JWT claims
- All tables include `tenant_id` column
- RLS policies enforce isolation automatically
- Server middleware extracts tenant from JWT

### Theme System
CSS variables define all colors and UI tokens. Themes are objects that get applied as CSS variables on `:root`. Dark mode toggles the `.dark` class.

### Plugin Architecture (Phase 4)
Types defined now, implementation coming. Plugins declare navigation, routes, settings tabs, and permissions. Static imports, lazy routes.

## Database Schema

Three core migrations:
1. **tenants_and_auth** — tenants, profiles, tenant_members + RLS
2. **billing** — subscriptions, invoices, payment_events + RLS
3. **notifications** — notifications + RLS

Verticals add their own migrations after these.

## Build

tsup compiles to ESM + CJS with TypeScript declarations. Multi-entry build for tree-shaking.
