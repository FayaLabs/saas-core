# Plugin: Services Catalog
> Service and product catalog with categories, packages, and cross-plugin detail tabs

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `services` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | yes |
| **Min Plan** | `free` |
| **Dependencies** | — |

## Description

The services plugin manages the catalog of services and/or products a business offers. For a beauty salon, these are haircuts, manicures, facials. For a restaurant, these are menu items. For a consultant, these are service packages.

**Value beyond CRUD:** The list uses `createCrudPage()`. The detail page (`/services/:id`) provides tabs for default products (what consumables are used), default forms (intake forms), pricing variations, and package composition. Other plugins inject tabs (inventory injects "Products Used", custom-forms injects "Forms", pricing injects "Price Tables").

## CRUD

Uses `createCrudPage(servicesEntityDef)` for list + create/edit.

### EntityDef Schema

```ts
const servicesEntityDef: EntityDef = {
  name: 'Service',
  namePlural: 'Services',
  icon: 'Briefcase',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, showInTable: true, searchable: true },
    { key: 'category_id', label: 'Category', type: 'select', showInTable: true },
    { key: 'duration_minutes', label: 'Duration (min)', type: 'number', showInTable: true },
    { key: 'price', label: 'Price', type: 'currency', showInTable: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'is_active', label: 'Active', type: 'boolean', defaultValue: true, showInTable: true },
    { key: 'color', label: 'Color', type: 'text' },
    { key: 'image_url', label: 'Image', type: 'image' },
    { key: 'requires_location', label: 'Requires Location', type: 'boolean' },
    { key: 'max_simultaneous', label: 'Max Simultaneous', type: 'number' },
  ],
  data: {
    table: 'services',
    tenantScoped: true,
    tenantIdColumn: 'company_id',
    searchColumns: ['name'],
  },
  defaultSort: 'name',
  displayField: 'name',
  imageField: 'image_url',
}
```

## Custom Pages

### Service Detail Page (`/services/:id`)

Built-in tabs:
| Tab | Description |
|-----|-------------|
| **Overview** | Name, category, price, duration, color, image |
| **Categories** | Category management (CRUD within page) |
| **Packages** | Service package composition (bundle services together) |

### Exposed Widget Zone: `services.detail.tabs`

Other plugins inject tabs:
- `inventory` → "Default Products" tab (consumables used per service execution)
- `custom-forms` → "Default Forms" tab (forms to fill during service)
- `pricing` → "Price Tables" tab (price variations for this service)
- `commissions` → "Commission Rules" tab (commission rules for this service)

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| main | 4 | Services | `/services` | `Briefcase` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/services` | authenticated | Service list (createCrudPage) |
| `/services/new` | authenticated | Create service |
| `/services/:id` | authenticated | Service detail (custom) |
| `/services/:id/edit` | authenticated | Edit service |
| `/services/categories` | authenticated | Category management |
| `/services/packages` | authenticated | Package management |

### Widget Zones

**Exposes:**
- `services.detail.tabs` — Tab injection on service detail page

**Injects into:** (none)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Services | Default duration, category management, active/inactive filtering |

## Database Tables

### `services`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| description | text | |
| category_id | uuid FK → service_categories | |
| duration_minutes | int | Default service duration |
| price | numeric(10,2) | Base price |
| is_active | boolean | Default true |
| color | text | Calendar color coding |
| image_url | text | |
| requires_location | boolean | Whether service needs a specific location/room |
| max_simultaneous | int | Max concurrent clients for this service |
| normalized_name | text | For search |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `service_categories`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| parent_id | uuid FK → service_categories | Hierarchical categories |
| sort_order | int | Display ordering |
| created_at | timestamptz | |

### `service_packages`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | Package name |
| description | text | |
| price | numeric(10,2) | Package price (may differ from sum of items) |
| is_active | boolean | |
| created_at | timestamptz | |

### `service_package_items`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| package_id | uuid FK → service_packages | |
| service_id | uuid FK → services | |
| quantity | int | Default 1 |

### `service_default_products`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| service_id | uuid FK → services | |
| product_id | uuid FK → products | |
| quantity | numeric | Amount used per execution |
| is_variable | boolean | Whether quantity varies per execution |

### `service_default_forms`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| service_id | uuid FK → services | |
| form_template_id | uuid FK → form_templates | |
| is_required | boolean | Must be completed before/during service |

### RPC Functions
- `search_services_normalized(text, uuid)` — Search services by normalized name
- `get_service_price(uuid)` — Get computed price (with variations if applicable)

## Key Workflows

### Service Creation
1. Admin opens `/services/new`
2. Fills name, category, duration, price
3. Optionally sets default products and forms on detail page
4. Service becomes available for scheduling

### Package Creation
1. Navigate to `/services/packages`
2. Create package with name and price
3. Add individual services to the package
4. Package appears as bookable item in scheduling

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| ServicesDashboard | `src/pages/servicos/ServicesDashboard.tsx` |
| ServiceForm | `src/pages/servicos/components/ServiceForm.tsx` |
| ServiceCategoriesList | `src/pages/servicos/components/ServiceCategoriesList.tsx` |
| ServiceDefaultProducts | `src/pages/servicos/components/ServiceDefaultProducts.tsx` |
| ServiceDefaultForms | `src/pages/servicos/components/ServiceDefaultForms.tsx` |
| ServicePackageForm | `src/pages/servicos/components/ServicePackageForm.tsx` |
| ServiceRevisionForms | `src/pages/servicos/components/ServiceRevisionForms.tsx` |
