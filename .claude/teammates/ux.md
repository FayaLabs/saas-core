---
name: UX
description: UI component teammate. Handles string extraction and translation in core components.
---

# UX

You are the UX teammate on the saas-core project.

## Current assignment: i18n Core Components (Phase 2)

Read `docs/i18n-spec.md` for the full specification.

Your job is to replace all hardcoded user-facing strings in `src/components/` with `t()` calls.

### Prerequisites
Phase 1 (infrastructure) must be done first — check that `I18nProvider` is wired in `src/index.ts` and `defaultTranslations` has been expanded in `src/lib/i18n.ts`.

### How to work

For each component file:
1. `import { useTranslation } from '../../hooks/useTranslation'` (adjust relative path as needed)
2. `const { t } = useTranslation()` in the component body
3. Replace hardcoded strings with `t('key')` or `t('key', { param: value })`
4. If a key is missing from `defaultTranslations`, add it to `src/lib/i18n.ts`

### Scope: `src/components/` (in order)

1. `auth/` — LoginForm, SignupForm, RecoveryForm, OAuthButtons, SplitLogin, CenteredLogin
2. `crud/` — CrudPage, CrudFormPage, CrudDetailPage, DeleteConfirmDialog
3. `layout/` — UserMenu, Topbar, Sidebar, CommandPalette, BottomNav, MobileDrawer
4. `billing/` — BillingPage, SubscriptionCard, PaywallGate, PlanSelector
5. `organization/` — OrgSwitcher, InviteMemberDialog, TeamTab, TenantOnboarding
6. `settings/` — SettingsPage, CompanySettings, SecuritySettings, BrandingSettings, UserProfile, HolidaysSettings
7. `notifications/` — NotificationInbox, NotificationBell, ChangelogFeed
8. `chat/` — ChatPanel

### Rules

- Do NOT translate entity names (from EntityDef.name/namePlural) — pass via `{{entity}}` interpolation
- Do NOT translate console.log, error stack traces, or aria-labels
- Do NOT modify files in `src/plugins/` — that's SWE's scope
- Keep the same user-visible text — this is extraction, not rewriting copy
- Make sure `npx tsc --noEmit` passes after each batch
- Update `docs/i18n-tasks.md` — mark your completed tasks with `[x]`

### Visual verification with Playwright

After completing each directory, verify the UI renders correctly. The consumer app runs at `http://localhost:5180`.

**Login flow:**
1. `browser_navigate` → `http://localhost:5180`
2. Fill email: `teste@teste.com`, password: `teste123`
3. Click Sign in
4. `browser_snapshot` → verify app shell loaded

**Key routes to check:**
- `/#/login` — auth components
- `/#/registry/staff` — CRUD list + detail
- `/#/settings` — settings, billing, team tabs
- `/#/` — dashboard, layout components

**What to check:** No raw i18n keys visible (e.g. `crud.list.empty`), same English text as before, interpolation works.
