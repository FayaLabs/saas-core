# i18n Tasks

Shared task bucket for the team. Pick a task, mark it `[~]` (in progress), complete it, mark `[x]`.

Read `docs/i18n-spec.md` before starting any task.

---

## Phase 1 — Infrastructure (ARCH)

- [ ] Wire `I18nProvider` into app tree in `src/index.ts` SaasApp component (outermost wrapper)
- [ ] Init locale store from `config.locale?.default` in useEffect
- [ ] Export `I18nProvider`, `useI18nConfig`, `defaultTranslations` from `src/lib/index.ts`
- [ ] Expand `defaultTranslations` in `src/lib/i18n.ts` — add ALL keys for auth, crud, layout, billing, organization, settings, notifications, common (~250 keys)
- [ ] Translate hardcoded strings in `src/index.ts` itself (404 page, access denied, settings tab labels)
- [ ] Verify `npx tsc --noEmit` passes

## Phase 2 — Core components (UX)

All in `src/components/`. Import `useTranslation` from `../../hooks/useTranslation`. Replace hardcoded strings with `t()` calls.

- [ ] `auth/` — LoginForm, SignupForm, RecoveryForm, OAuthButtons, SplitLogin, CenteredLogin
- [ ] `crud/` — CrudPage, CrudFormPage, CrudDetailPage, DeleteConfirmDialog
- [ ] `layout/` — UserMenu, Topbar, Sidebar, CommandPalette, BottomNav, MobileDrawer
- [ ] `billing/` — BillingPage, SubscriptionCard, PaywallGate, PlanSelector
- [ ] `organization/` — OrgSwitcher, InviteMemberDialog, TeamTab, TenantOnboarding
- [ ] `settings/` — SettingsPage, CompanySettings, SecuritySettings, BrandingSettings, UserProfile, HolidaysSettings
- [ ] `notifications/` — NotificationInbox, NotificationBell, ChangelogFeed
- [ ] `chat/` — ChatPanel
- [ ] Playwright verify: login, check key pages, no raw i18n keys visible

## Phase 3 — Plugin strings (SWE)

Each plugin adds keys to `defaultTranslations` with plugin-prefixed namespace.

- [x] `agenda/` — CalendarView, AppointmentModal, ConfirmationsView, WorkingHoursView
- [x] `financial/` — SummaryView, InvoiceFormView, InvoiceDetailView, StatementsView, CardsView
- [x] `crm/` — DealBoard, LeadDetailView, QuoteFormView, QuoteDetailView
- [x] `inventory/` — RecipeDetailView, StockView

## Phase 4 — Validation (Lead)

- [ ] `npx tsc --noEmit` passes
- [ ] Grep for remaining hardcoded English strings
- [ ] Playwright smoke: login → dashboard → CRUD → settings → no raw keys
- [ ] Test consumer locale override
- [ ] Update `docs/TODO.md` — mark i18n complete
