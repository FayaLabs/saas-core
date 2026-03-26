# Plugin: Pricing & Price Tables
> Multiple price tables, price variations, and payment method fee configuration

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `pricing` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | `services` |

## Description

The pricing plugin adds advanced pricing beyond the simple `price` field on services. It supports multiple price tables (e.g., "Regular", "VIP", "Weekend"), price variations (by staff, by time slot, by location), and payment method price adjustments (discounts for cash, surcharges for installments).

**Value beyond CRUD:** This is a configuration/rules plugin. It injects a "Price Tables" tab into `services.detail.tabs` and provides settings-only routes for managing pricing rules. No standalone page in the main nav — accessed through settings.

## Integration Points

### Navigation (Sidebar)
None — settings-only plugin.

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/settings/pricing` | authenticated | Price table management |
| `/settings/pricing/:id` | authenticated | Price table detail |
| `/settings/price-variations` | authenticated | Variation rule management |

### Widget Zones

**Injects into:**
- `services.detail.tabs` → "Pricing" tab (price per table for this service)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Pricing | Price table CRUD, variation rules, payment method fee config |

## Database Tables

### `price_tables`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | e.g., "Regular", "VIP", "Weekend" |
| is_default | boolean | |
| is_active | boolean | |
| created_at | timestamptz | |

### `price_table_items`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| table_id | uuid FK → price_tables | |
| service_id | uuid FK → services | |
| price | numeric(10,2) NOT NULL | |
| UNIQUE | (table_id, service_id) | |

### `price_variations`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| type | text | `staff`, `time_slot`, `location`, `day_of_week` |
| config | jsonb | Variation-specific config |
| adjustment_type | text | `percentage`, `fixed` |
| adjustment_value | numeric(10,2) | Positive = surcharge, negative = discount |
| is_active | boolean | |

### RPC Functions
- `calculate_price_variation(uuid, jsonb)` — Calculate final price with applicable variations
- `get_service_price(uuid)` — Get computed price for a service (base + variations)

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| PriceTables | `src/pages/configuracoes/tabelas-preco/PriceTables.tsx` |
| PriceTableForm | `src/pages/configuracoes/tabelas-preco/PriceTableForm.tsx` |
| PriceVariations | `src/pages/configuracoes/variacoes-preco/PriceVariations.tsx` |
| PriceVariationForm | `src/pages/configuracoes/variacoes-preco/PriceVariationForm.tsx` |
