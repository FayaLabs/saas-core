# AI Agent Guide

Instructions for AI coding agents working with `@fayz/saas-core`.

## Rules

1. **Never modify core migrations** without understanding RLS implications
2. **Use subpath imports** — `@fayz/saas-core/components`, not deep paths
3. **Extend, don't fork** — add plugins and entities, don't copy core code
4. **Tenant isolation is non-negotiable** — every table needs `tenant_id` + RLS

## Common Tasks

### Adding a new component
1. Create in `src/components/{feature}/`
2. Export from feature's `index.ts`
3. Re-export from `src/components/index.ts`

### Adding a new hook
1. Create in `src/hooks/`
2. Export from `src/hooks/index.ts`

### Adding a new store
1. Create in `src/stores/`
2. Export from `src/stores/index.ts`

### Adding a migration
1. Create in `supabase/migrations/` with sequential numbering
2. Always include `tenant_id` column
3. Always enable RLS
4. Add appropriate policies

### Creating a vertical plugin
```typescript
const myPlugin: PluginManifest = {
  id: 'appointments',
  name: 'Appointments',
  icon: 'Calendar',
  version: '1.0.0',
  navigation: [
    { section: 'main', position: 10, label: 'Appointments', route: '/appointments' },
  ],
  routes: [
    { path: '/appointments', component: AppointmentsList, guard: 'authenticated' },
  ],
  permissions: ['manage_appointments', 'view_appointments'],
}
```

## File Conventions

- Components: PascalCase (`LoginForm.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Stores: camelCase with `.store` suffix (`auth.store.ts`)
- Types: camelCase (`auth.ts`)
- Server: camelCase with purpose suffix (`authenticate.ts`, `tenant.service.ts`)
