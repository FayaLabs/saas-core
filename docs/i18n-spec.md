# i18n Specification

## Goal

Make every user-facing string in saas-core translatable. The package ships with English as the default locale. Consumer apps can provide additional locales at init time.

## Existing Infrastructure (use this, don't install new libs)

The i18n system is already built — it just needs to be wired up and used:

- `src/lib/i18n.ts` — `I18nProvider` (React context), `useI18nConfig()`, `defaultTranslations`
- `src/hooks/useTranslation.ts` — `useTranslation()` hook with `{{param}}` interpolation
- `src/stores/locale.store.ts` — Zustand store for current locale

**No new dependencies.** Do NOT install i18next or react-i18next.

## How it works

```tsx
import { useTranslation } from '../../hooks/useTranslation'

function MyComponent() {
  const { t } = useTranslation()
  return <button>{t('common.save')}</button>
}
```

With interpolation:
```tsx
t('crud.list.empty', { entities: namePlural.toLowerCase() })
// → "No service categories yet"
```

Lookup chain: `locale translations → defaultTranslations → raw key`

## Key naming convention

Flat dot-notation: `section.subsection.key` — all lowercase.

```
common.save              → "Save"
common.cancel            → "Cancel"
common.delete            → "Delete"
common.edit              → "Edit"
common.back              → "Back"
common.close             → "Close"
common.confirm           → "Confirm"
common.loading           → "Loading..."
crud.list.empty          → "No {{entities}} yet"
crud.list.addFirst       → "Add your first {{entity}}"
crud.list.totalCount     → "{{count}} total {{entities}}"
crud.list.search         → "Search {{entities}}..."
crud.detail.notFound     → "{{entity}} not found."
crud.delete.title        → "Delete {{entity}}?"
auth.login.title         → "Sign in"
auth.login.email         → "Email"
auth.login.password      → "Password"
```

## Where translations live

All default EN translations go in `defaultTranslations` in `src/lib/i18n.ts` — a single flat `Record<string, string>`.

## Entity names

Entity names come from `EntityDef.name` / `EntityDef.namePlural`. These are NOT translated via i18n — they are config-driven. Consumer apps set them in their language. The i18n layer only wraps the surrounding UI chrome. Pass entity names via interpolation:

```tsx
t('crud.list.empty', { entities: namePlural.toLowerCase() })
```

## API surface for consumers

```typescript
createSaasApp({
  locale: {
    default: 'pt-BR',
    supported: ['en', 'pt-BR'],
    translations: {
      'pt-BR': {
        'common.save': 'Salvar',
        'common.cancel': 'Cancelar',
        'auth.login.title': 'Entrar',
        // ... overrides
      }
    }
  }
})
```

## Rules for teammates

1. **Use the existing system** — `import { useTranslation } from '../../hooks/useTranslation'`
2. **Never translate entity names** — they come from EntityDef config
3. **Interpolate, don't concatenate** — `t('greeting', { name })` not `t('hello') + ' ' + name`
4. **Add missing keys to `defaultTranslations`** in `src/lib/i18n.ts`
5. **Don't translate developer-facing strings** — console.log, error stack traces, debug info
6. **Don't translate aria-labels** — follow-up pass
7. **Keep the same user-visible text** — this is extraction, not rewriting copy
