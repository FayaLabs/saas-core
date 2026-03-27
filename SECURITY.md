# Security Warning: Core Supabase Credentials

## Critical Issue

`VITE_SAAS_CORE_SUPABASE_URL` and `VITE_SAAS_CORE_ANON_KEY` are exposed to the client browser because Vite injects all `VITE_*` env vars into the bundle. This means:

1. Any user can inspect the browser's network requests and see the core Supabase URL
2. The anon key is visible in the JavaScript bundle
3. A malicious user could use these credentials to directly query the core platform DB

## Current Risk Level

**Medium** — The anon key only grants access through RLS policies. As long as RLS is properly configured on all core tables (tenants, profiles, billing, etc.), direct access is limited to what the authenticated user's RLS policies allow.

## Future Mitigation Plan

### Short-term
- Ensure ALL core tables have strict RLS policies (already done in migrations)
- Never store secrets (API keys, tokens) in the core DB accessible via anon key
- Use service_role key only server-side (edge functions)

### Medium-term
- Move core Supabase calls to a server-side proxy / API layer
- SaaS clients call our API, not Supabase directly
- Core credentials never reach the browser

### Long-term
- Replace direct Supabase access with a dedicated auth/platform API
- Core Supabase becomes purely server-side
- Client apps only know their own project Supabase URL
- Consider using Supabase's `publishable` keys (limited scope) instead of anon keys

## DO NOT

- Never use `service_role` key in client-side code
- Never disable RLS on core tables
- Never store sensitive business logic credentials in tables accessible by anon key
