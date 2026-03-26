# Plugin: Inventory & Stock
> Product catalog, stock movements, locations, DANFE import, recipes, and barcode management

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `inventory` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | — |

## Description

The inventory plugin manages the complete product lifecycle: catalog management, stock level tracking across multiple locations, stock movement history (in/out/adjustment/transfer), recipe/bill-of-materials composition, barcode scanning, and DANFE (Brazilian tax invoice) import for automated stock entry.

**Value beyond CRUD:** While the product list uses `createCrudPage()`, the plugin provides a multi-view dashboard with 8 sub-pages (overview, products, movements, categories, locations, DANFE imports, recipes, audit). It also injects a "Default Products" tab into `services.detail.tabs` showing which consumables are used per service execution.

## CRUD

Uses `createCrudPage(productsEntityDef)` for the products list + create/edit.

### EntityDef Schema

```ts
const productsEntityDef: EntityDef = {
  name: 'Product',
  namePlural: 'Products',
  icon: 'Package',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, showInTable: true, searchable: true },
    { key: 'sku', label: 'SKU', type: 'text', showInTable: true, searchable: true },
    { key: 'category_id', label: 'Category', type: 'select', showInTable: true },
    { key: 'unit_id', label: 'Unit', type: 'select', showInTable: true },
    { key: 'cost_price', label: 'Cost Price', type: 'currency', showInTable: true },
    { key: 'sale_price', label: 'Sale Price', type: 'currency', showInTable: true },
    { key: 'min_stock', label: 'Min Stock', type: 'number' },
    { key: 'max_stock', label: 'Max Stock', type: 'number' },
    { key: 'is_active', label: 'Active', type: 'boolean', defaultValue: true, showInTable: true },
    { key: 'image_url', label: 'Image', type: 'image' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  data: {
    table: 'products',
    tenantScoped: true,
    tenantIdColumn: 'company_id',
    searchColumns: ['name', 'sku'],
  },
  defaultSort: 'name',
  displayField: 'name',
  imageField: 'image_url',
}
```

## Custom Pages

### Inventory Dashboard (`/inventory`)

Multi-view dashboard:

| View | Route | Description |
|------|-------|-------------|
| Overview | `/inventory` | Stock level charts, low stock alerts, value summary |
| Products | `/inventory/products` | Product list (createCrudPage) |
| Movements | `/inventory/movements` | Stock movement history |
| Categories | `/inventory/categories` | Category management |
| Locations | `/inventory/locations` | Storage location management |
| DANFE Import | `/inventory/danfe` | Tax invoice import for stock entry |
| Recipes | `/inventory/recipes` | Recipe/BOM management |
| Audit | `/inventory/audit` | Product usage audit trail |

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| main | 5 | Inventory | `/inventory` | `Package` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/inventory` | authenticated | Inventory dashboard |
| `/inventory/products` | authenticated | Products list |
| `/inventory/products/new` | authenticated | Create product |
| `/inventory/products/:id` | authenticated | Product detail |
| `/inventory/movements` | authenticated | Stock movements |
| `/inventory/movements/new` | authenticated | Record stock movement |
| `/inventory/categories` | authenticated | Category management |
| `/inventory/locations` | authenticated | Location management |
| `/inventory/danfe` | authenticated | DANFE import list |
| `/inventory/recipes` | authenticated | Recipe management |
| `/inventory/audit` | authenticated | Usage audit |

### Widget Zones

**Exposes:**
- `inventory.product.detail.tabs` — Tab injection on product detail page

**Injects into:**
- `services.detail.tabs` → "Default Products" tab (consumables used per service)
- `shell.sidebar.footer` → Low stock alert badge

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Inventory | Stock alert thresholds, default location, barcode format, measurement units |

## Database Tables

### `products`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| sku | text | Stock keeping unit |
| description | text | |
| category_id | uuid FK → product_categories | |
| unit_id | uuid FK → measurement_units | |
| cost_price | numeric(10,2) | |
| sale_price | numeric(10,2) | |
| min_stock | numeric | Low stock threshold |
| max_stock | numeric | Overstock threshold |
| current_stock | numeric | Denormalized total across locations |
| is_active | boolean | |
| image_url | text | |
| normalized_name | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `product_categories`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| parent_id | uuid FK → product_categories | Hierarchical |
| sort_order | int | |

### `product_barcodes`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| product_id | uuid FK → products | |
| barcode | text NOT NULL | |
| type | text | `EAN13`, `EAN8`, `UPC`, `CODE128` |

### `stock_locations`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| is_default | boolean | |
| is_active | boolean | |

### `stock_positions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| product_id | uuid FK → products | |
| location_id | uuid FK → stock_locations | |
| quantity | numeric NOT NULL | Current quantity at this location |
| updated_at | timestamptz | |
| UNIQUE | (product_id, location_id) | |

### `stock_movements`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| product_id | uuid FK → products | |
| location_id | uuid FK → stock_locations | |
| type | text NOT NULL | `in`, `out`, `adjustment`, `transfer`, `loss` |
| quantity | numeric NOT NULL | Positive for in, negative for out |
| reference_type | text | `manual`, `appointment`, `danfe`, `order`, `audit` |
| reference_id | uuid | FK to source record |
| cost_price | numeric(10,2) | Unit cost at time of movement |
| notes | text | |
| created_by | uuid FK → auth.users | |
| created_at | timestamptz | |

### `measurement_units`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | e.g., "ml", "g", "unit", "kg" |
| abbreviation | text | |

### `unit_conversions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| from_unit_id | uuid FK → measurement_units | |
| to_unit_id | uuid FK → measurement_units | |
| factor | numeric NOT NULL | Multiply from_unit by this to get to_unit |

### `recipes`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| product_id | uuid FK → products | Output product |
| yield_quantity | numeric | How much the recipe produces |
| instructions | text | |
| created_at | timestamptz | |

### `recipe_ingredients`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| recipe_id | uuid FK → recipes | |
| product_id | uuid FK → products | Ingredient product |
| quantity | numeric NOT NULL | |
| unit_id | uuid FK → measurement_units | |

### `danfe_imports`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| xml_url | text | Uploaded XML file |
| supplier_name | text | |
| invoice_number | text | |
| total_value | numeric(12,2) | |
| status | text | `pending`, `processed`, `partial`, `error` |
| processed_at | timestamptz | |
| created_at | timestamptz | |

### `danfe_import_items`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| import_id | uuid FK → danfe_imports | |
| product_id | uuid FK → products | Matched product |
| description | text | From XML |
| quantity | numeric | |
| unit_price | numeric(10,2) | |
| total_price | numeric(10,2) | |
| matched | boolean | Whether auto-matched to existing product |

### `execution_products`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| appointment_id | uuid FK → appointments | |
| product_id | uuid FK → products | |
| quantity | numeric NOT NULL | |
| staff_id | uuid FK → staff_members | |

### RPC Functions
- `deduct_stock_on_execution()` — Trigger: reduce stock when products used in service
- `update_product_quantity()` — Recalculate product.current_stock from stock_positions
- `adjust_stock_on_audit()` — Adjust stock levels during audit
- `search_products_normalized(text, uuid)` — Search products by normalized name

## Key Workflows

### Stock Entry (Manual)
1. Navigate to `/inventory/movements/new`
2. Select product, location, quantity
3. Movement type: `in`
4. Stock position updated, product.current_stock recalculated

### Stock Entry (DANFE Import)
1. Upload DANFE XML at `/inventory/danfe`
2. System parses items, attempts auto-match to existing products
3. User reviews matches, creates new products if needed
4. Confirm → stock movements created for all items

### Service Product Deduction
1. During service execution (scheduling plugin), products are recorded
2. On appointment completion, trigger `deduct_stock_on_execution()`
3. Stock positions and product quantities updated
4. If below min_stock, low stock alert shown

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| InventoryDashboard | `src/pages/estoque/InventoryDashboard.tsx` |
| ProductsList | `src/pages/estoque/views/ProductsList.tsx` |
| ProductForm | `src/pages/estoque/components/ProductForm.tsx` |
| StockMovements | `src/pages/estoque/views/StockMovements.tsx` |
| StockLocationsList | `src/pages/estoque/views/StockLocationsList.tsx` |
| DanfeImportsList | `src/pages/estoque/views/DanfeImportsList.tsx` |
| DanfeImportModal | `src/pages/estoque/components/DanfeImportModal.tsx` |
| RecipesList | `src/pages/estoque/views/RecipesList.tsx` |
| ProductUsageAudit | `src/pages/estoque/views/ProductUsageAudit.tsx` |
| ProductCategoriesList | `src/pages/estoque/views/ProductCategoriesList.tsx` |
