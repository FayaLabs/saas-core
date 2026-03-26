# Plugin: Field Configuration
> Per-role field visibility and required field rules across all entity forms

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `field-config` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | — |

## Description

The field-config plugin is a meta-configuration layer that controls which fields appear in entity forms and which are required, per user role. It stores rules that other plugins' forms consult at render time. For example, an admin might configure that the "CPF" field on the client form is required for the "receptionist" role but hidden for the "manager" role.

**Value beyond CRUD:** This is a settings-only plugin with no standalone pages. It provides a settings tab with a visual rule builder for configuring field visibility and requirements per entity type and role.

## Integration Points

### Navigation (Sidebar)
None — settings-only plugin.

### Routes
None — accessed via settings tabs.

### Widget Zones

**Injects into:** (none — consumed by other plugins at form render time)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Field Visibility | Rule builder: per entity type, select fields to show/hide per role |
| Required Fields | Rule builder: per entity type, set required fields per role |

## Database Tables

### `field_visibility_rules`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| entity_type | text NOT NULL | `client`, `staff`, `service`, `product`, etc. |
| field_key | text NOT NULL | Field key from EntityDef |
| role | text NOT NULL | User role |
| is_visible | boolean | Default true |
| UNIQUE | (company_id, entity_type, field_key, role) | |

### `field_requirement_rules`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| entity_type | text NOT NULL | |
| field_key | text NOT NULL | |
| role | text NOT NULL | |
| is_required | boolean | Default false |
| UNIQUE | (company_id, entity_type, field_key, role) | |

## Key Workflows

### Configuring Field Visibility
1. Admin navigates to Settings → Field Visibility
2. Selects entity type (e.g., "Client")
3. For each field, toggles visibility per role
4. On save, rules stored in `field_visibility_rules`
5. When any plugin renders a client form, it queries these rules to show/hide fields

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| FieldVisibilityConfig | `src/pages/configuracoes/ocultacao-dados/FieldVisibilityConfig.tsx` |
| RequiredFields | `src/pages/configuracoes/campos-obrigatorios/RequiredFields.tsx` |
