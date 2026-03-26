# Plugin: Global Search
> Cross-entity search with text normalization and plugin-aware result discovery

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `global-search` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | yes |
| **Min Plan** | `free` |
| **Dependencies** | — |

## Description

The global search plugin provides a unified search experience across all entities from active plugins. It normalizes text (strips accents for Portuguese/multilingual search) and discovers searchable entities based on which plugins are active. The search widget lives in the topbar.

**Value beyond CRUD:** This is a pure widget/integration plugin. It has no pages of its own — just a topbar search input and result dropdown. It uses RPC functions for normalized text search and aggregates results from clients, staff, services, products, and contacts.

## Integration Points

### Navigation (Sidebar)
None — widget-only plugin.

### Routes
None.

### Widget Zones

**Injects into:**
- `shell.topbar.start` → Search input with result dropdown

### Settings Tabs
None.

## Database Tables

No own tables. Uses RPC functions to search across other plugins' tables.

### RPC Functions (from other plugins, consumed here)
- `normalize_text(text)` — Strips accents for search
- `search_clients_normalized(text, uuid)` — Search clients
- `search_professionals_normalized(text, uuid)` — Search staff
- `search_services_normalized(text, uuid)` — Search services
- `search_products_normalized(text, uuid)` — Search products
- `search_contacts_normalized(text, text, uuid)` — Search contacts by type
- `search_employees_normalized(text, uuid)` — Search employees

### Entity Discovery

On mount, global search checks which plugins are active and registers their search functions:

| Plugin | Entity | Search Function |
|--------|--------|----------------|
| `clients` | Clients | `search_clients_normalized` |
| `staff` | Staff | `search_professionals_normalized` |
| `services` | Services | `search_services_normalized` |
| `inventory` | Products | `search_products_normalized` |

Results are grouped by entity type with icons and direct links to detail pages.

## Key Workflows

### Search
1. User types in topbar search input (keyboard shortcut: Cmd+K)
2. Debounced query sent to all registered search functions
3. Results grouped by entity type
4. Click result → navigate to entity detail page

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| GlobalSearch | `src/components/GlobalSearch.tsx` |
