# saas-core

Reusable vertical SaaS foundation package (`@fayz/saas-core`) — auth, billing, tenancy, layout, CRUD, plugins.

## Stack

- React 18 + TypeScript, Radix UI primitives, Tailwind CSS, Zustand stores
- Supabase (auth, DB, RLS), Vite build
- Published as npm package with `dist/` entry points

## Structure

- `src/components/` — UI: auth, billing, crud, layout, organization, settings, notifications, chat
- `src/plugins/` — vertical plugins: agenda, financial, inventory, crm
- `src/stores/` — Zustand stores (auth, org, billing, permissions, theme, crud)
- `src/lib/` — data providers (supabase, mock, archetype), router, utils
- `src/types/` — entity archetypes, crud types, plugin types
- `supabase/migrations/` — DB migrations

## Conventions

- No default exports. Named exports only.
- Component files are PascalCase, everything else kebab-case or camelCase.
- Entity definitions use `EntityDef` with fields, archetype config, and data provider binding.
- Archetype system: person, category, product, service, order, transaction, schedule, location.
- Plugins register via `definePlugin()` with routes, registries, widgets, settings.
- CRUD pages are generated via `createCrudPage(entityDef, options)`.

## Commands

- `npx tsc --noEmit` — type check
- `npm run dev` — dev server (Vite)
- `npm run build` — production build

## Current initiative: i18n

See `docs/i18n-spec.md` for the full specification. All teammates should read it before starting work.
