# Plugin: CRM & Sales Pipeline
> Quotes, sales journey tracking, pipeline visualization, and lead management

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `crm` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | `clients` |

## Description

The CRM plugin adds sales pipeline management on top of the client database. It tracks the complete sales journey from lead → quote → appointment → invoice → completion. Provides quote generation with approval/rejection workflows, pipeline visualization, and conversion tracking.

**Value beyond CRUD:** Pipeline board (kanban-style), quote builder with line items and PDF preview, and sales journey linking (connecting quotes to appointments to invoices for end-to-end tracking). Injects "Quotes" tab into `clients.detail.tabs`.

## Custom Pages

### CRM Dashboard (`/crm`)

| View | Route | Description |
|------|-------|-------------|
| Pipeline | `/crm` | Kanban board of sales stages |
| Quotes | `/crm/quotes` | Quote list with status filters |
| Quote Detail | `/crm/quotes/:id` | Quote with line items, approval, PDF preview |

### Sales Journey Stages
```
initiated → quoted → scheduled → executed → completed
```

Each stage links to a real entity:
- `quoted` → quote_items
- `scheduled` → appointment_services
- `executed` → invoice_items

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| main | 7 | CRM | `/crm` | `Target` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/crm` | authenticated | Pipeline board |
| `/crm/quotes` | authenticated | Quote list |
| `/crm/quotes/new` | authenticated | Create quote |
| `/crm/quotes/:id` | authenticated | Quote detail |

### Widget Zones

**Injects into:**
- `clients.detail.tabs` → "Quotes" tab (quote history, active deals)

## Database Tables

### `quotes`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| client_id | uuid FK → clients | |
| staff_id | uuid FK → staff_members | Salesperson |
| status | text | `draft`, `sent`, `approved`, `rejected`, `expired` |
| valid_until | date | |
| subtotal | numeric(12,2) | |
| discount | numeric(12,2) | |
| total | numeric(12,2) | |
| notes | text | |
| rejection_reason | text | |
| approved_at | timestamptz | |
| rejected_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `quote_items`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| quote_id | uuid FK → quotes | |
| service_id | uuid FK → services | |
| product_id | uuid FK → products | |
| description | text NOT NULL | |
| quantity | numeric NOT NULL | |
| unit_price | numeric(10,2) NOT NULL | |
| discount | numeric(10,2) | |
| total | numeric(12,2) | |

### `sales_journey`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| client_id | uuid FK → clients | |
| service_id | uuid FK → services | |
| stage | text | `initiated`, `quoted`, `scheduled`, `executed`, `completed` |
| quote_item_id | uuid FK → quote_items | |
| appointment_service_id | uuid FK → appointment_services | |
| invoice_item_id | uuid FK → invoice_items | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### RPC Functions
- `link_quote_item_to_journey()` — Trigger: link quote creation to journey
- `link_appointment_service_to_journey()` — Trigger: link appointment to journey
- `link_invoice_item_to_journey()` — Trigger: link invoice to journey
- `update_journey_on_appointment_status()` — Trigger: advance journey stage
- `unlink_appointment_from_journey()` — Trigger: handle appointment cancellation

## Key Workflows

### Quote-to-Sale Journey
1. Create quote for client with service line items
2. Send quote → client approves
3. Convert quote to appointment (scheduling plugin)
4. Appointment completed → invoice generated (financial plugin)
5. Invoice paid → journey marked as `completed`
6. All stages linked via `sales_journey` table

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| CRMDashboard | `src/pages/crm/CRMDashboard.tsx` |
| QuotesList | `src/pages/crm/components/QuotesList.tsx` |
| QuoteForm | `src/pages/crm/components/QuoteForm.tsx` |
| QuotePrintPreview | `src/pages/crm/components/QuotePrintPreview.tsx` |
| QuoteApprovalModal | `src/pages/crm/components/QuoteApprovalModal.tsx` |
| ClientJourneyView | `src/pages/crm/components/ClientJourneyView.tsx` |
