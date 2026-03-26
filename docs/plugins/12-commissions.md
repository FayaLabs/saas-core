# Plugin: Commissions
> Rule-based commission calculation for staff based on services rendered and revenue

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `commissions` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `pro` |
| **Dependencies** | `staff`, `services`, `financial` |

## Description

The commissions plugin provides a rule engine for calculating staff commissions based on services performed, products sold, and revenue generated. Rules can be configured by service, by staff member, by revenue tier, or by custom criteria. Supports multiple commission models (flat rate, percentage, tiered).

**Value beyond CRUD:** This is a rules/calculation engine. It injects "Commissions" tab into `staff.detail.tabs` and "Commission Rules" tab into `services.detail.tabs`. Provides a dedicated page for rule management and calculation review.

## Custom Pages

### Commissions Dashboard (`/commissions`)

| View | Route | Description |
|------|-------|-------------|
| Overview | `/commissions` | Commission summary by staff for period |
| Rules | `/commissions/rules` | Commission rule management |
| Calculations | `/commissions/calculations` | Detailed calculation breakdown |

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 5 | Commissions | `/commissions` | `Percent` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/commissions` | authenticated | Commission summary |
| `/commissions/rules` | authenticated | Rule management |
| `/commissions/rules/new` | authenticated | Create rule |
| `/commissions/rules/:id` | authenticated | Edit rule |
| `/commissions/calculations` | authenticated | Calculation details |

### Widget Zones

**Injects into:**
- `staff.detail.tabs` → "Commissions" tab (earnings, rules, period breakdown)
- `services.detail.tabs` → "Commission Rules" tab (rules for this service)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Commissions | Default commission model, payout schedule |

## Database Tables

### `commission_rules`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| type | text | `percentage`, `fixed`, `tiered` |
| value | numeric(10,2) | For percentage/fixed types |
| is_active | boolean | |
| applies_to | text | `all_services`, `specific_services`, `specific_staff` |
| created_at | timestamptz | |

### `commission_rule_criteria`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| rule_id | uuid FK → commission_rules | |
| criteria_type | text | `service`, `staff`, `revenue_tier` |
| criteria_value | text | Service ID, staff ID, or tier threshold |
| commission_value | numeric(10,2) | Override value for this criterion |

### `commission_functions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| role | text | Commission role/distribution function |
| config | jsonb | Custom calculation parameters |

## Key Workflows

### Commission Calculation
1. Appointment completed → invoice paid
2. Commission rules evaluated for each invoice item
3. Match by service, staff member, or revenue tier
4. Calculate commission amount
5. Display in staff detail → "Commissions" tab

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| CommissionRulesList | `src/pages/configuracoes/comissoes/CommissionRulesList.tsx` |
| CommissionRuleForm | `src/pages/configuracoes/comissoes/CommissionRuleForm.tsx` |
| CommissionFunctionsForm | `src/pages/configuracoes/comissoes/CommissionFunctionsForm.tsx` |
