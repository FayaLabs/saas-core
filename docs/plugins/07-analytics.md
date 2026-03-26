# Plugin: Analytics & Reports
> Multi-dimensional reporting engine with charts, period filtering, and export

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `analytics` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | yes |
| **Min Plan** | `free` |
| **Dependencies** | — |

## Description

The analytics plugin provides a reporting engine that reads data across all active plugins and generates visual reports with charts, tables, and KPIs. It discovers available report dimensions based on which plugins are active (e.g., if `scheduling` is active, appointment reports appear; if `financial` is active, revenue reports appear).

**Value beyond CRUD:** This is a pure reporting/visualization plugin with no entity CRUD. It renders charts (Recharts), filterable tables, and exportable reports. Report categories are dynamically populated based on active plugins.

## Custom Pages

### Reports Dashboard (`/reports`)

Dynamic report categories based on active plugins:

| Category | Requires Plugin | Reports |
|----------|----------------|---------|
| **Scheduling** | `scheduling` | Appointments by period, Occupancy rate, Confirmations, Cancellations, No-shows, Peak hours, Avg service time, Appointments by channel |
| **Financial** | `financial` | Revenue by period, P&L (DRE), Cash flow, Payables, Receivables, Payment methods analysis, Revenue by service, Revenue by professional, Cost analysis |
| **Clients** | `clients` | Active client base, New clients, Visit frequency, Avg ticket, Inactive clients, Birthday calendar, Service preferences, Client origin, Demographics, Retention/churn |
| **Staff** | `staff` | Professional performance, Revenue per professional, Appointments per professional, Commission calculations, Attendance rate |
| **Services** | `services` | Service popularity, Revenue by service, Duration analysis, Service combinations |
| **Inventory** | `inventory` | Stock levels, Stock movements, Product categories, Low stock items, Product value |

Each report includes:
- Period selector (day/week/month/quarter/year/custom)
- Comparison toggle (vs. previous period)
- Chart visualization (bar, line, pie, area)
- Data table with sorting/filtering
- Export to CSV/PDF

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 1 | Reports | `/reports` | `BarChart3` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/reports` | authenticated | Reports dashboard |
| `/reports/:category` | authenticated | Category reports |
| `/reports/:category/:reportId` | authenticated | Specific report |

### Widget Zones

**Exposes:** (none)

**Injects into:**
- `shell.sidebar.footer` → Quick stats summary widget

### Settings Tabs
None (reports are read-only views)

## Database Tables

### `saved_reports` (optional, for saved custom reports)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| category | text | Report category |
| filters | jsonb | Saved filter state |
| created_by | uuid FK → auth.users | |
| created_at | timestamptz | |

Note: The analytics plugin primarily reads from other plugins' tables. It does not own significant data — it generates reports by querying `appointments`, `invoices`, `clients`, `staff_members`, `services`, `products`, `stock_movements`, etc.

## Key Workflows

### Viewing a Report
1. Navigate to `/reports`
2. Select category (e.g., "Financial")
3. Select report (e.g., "Revenue by Period")
4. Set date range and filters
5. Chart and table render with data
6. Optionally export to CSV/PDF

### Dynamic Report Discovery
1. On mount, analytics checks which plugins are active in the runtime
2. Builds category list based on available data sources
3. Only shows reports whose data dependencies are satisfied

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| ReportsDashboard | `src/pages/relatorios/ReportsDashboard.tsx` |
| Report chart components | `src/pages/relatorios/components/` |
