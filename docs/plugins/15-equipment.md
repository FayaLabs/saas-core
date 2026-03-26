# Plugin: Equipment & Assets
> Equipment catalog, asset tracking, and maintenance scheduling

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `equipment` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | — |

## Description

The equipment plugin manages physical assets: salon chairs, laser machines, restaurant ovens, medical devices, etc. Tracks equipment details, photos, maintenance history, and assignment to service locations.

**Value beyond CRUD:** The list uses `createCrudPage()`. Adds an equipment detail page with maintenance log and location assignment. Useful for businesses with significant physical assets that need tracking.

## CRUD

Uses `createCrudPage(equipmentEntityDef)` for list + create/edit.

### EntityDef Schema

```ts
const equipmentEntityDef: EntityDef = {
  name: 'Equipment',
  namePlural: 'Equipment',
  icon: 'Wrench',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, showInTable: true, searchable: true },
    { key: 'model', label: 'Model', type: 'text', showInTable: true },
    { key: 'serial_number', label: 'Serial Number', type: 'text', showInTable: true },
    { key: 'category', label: 'Category', type: 'text', showInTable: true },
    { key: 'location_id', label: 'Location', type: 'select', showInTable: true },
    { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    { key: 'purchase_price', label: 'Purchase Price', type: 'currency' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'maintenance', 'retired'], showInTable: true },
    { key: 'image_url', label: 'Photo', type: 'image' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  data: {
    table: 'equipment',
    tenantScoped: true,
    tenantIdColumn: 'company_id',
    searchColumns: ['name', 'model', 'serial_number'],
  },
  defaultSort: 'name',
  displayField: 'name',
  imageField: 'image_url',
}
```

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 6 | Equipment | `/equipment` | `Wrench` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/equipment` | authenticated | Equipment list (createCrudPage) |
| `/equipment/new` | authenticated | Add equipment |
| `/equipment/:id` | authenticated | Equipment detail |

### Widget Zones

**Exposes:**
- `equipment.detail.tabs` — Tab injection on equipment detail

**Injects into:** (none)

## Database Tables

### `equipment`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| model | text | |
| serial_number | text | |
| category | text | |
| location_id | uuid FK → service_locations | |
| purchase_date | date | |
| purchase_price | numeric(10,2) | |
| status | text | `active`, `maintenance`, `retired` |
| image_url | text | |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Storage Buckets
- `equipment-photos` — Equipment images

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| EquipmentList | `src/pages/cadastro/equipamentos/EquipmentList.tsx` |
| EquipmentForm | `src/pages/cadastro/equipamentos/EquipmentForm.tsx` |
