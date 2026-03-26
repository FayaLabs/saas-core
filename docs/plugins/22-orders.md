# Plugin: Orders & Delivery
> Table-based ordering, kitchen queue/KDS, table management, and delivery tracking

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `orders` |
| **Scope** | `niche` |
| **Niche** | `food` |
| **Default** | yes |
| **Min Plan** | `free` |
| **Dependencies** | `services`, `inventory` |

## Description

The orders plugin is the operational core of food-service businesses. It provides table-based ordering, a kitchen display system (KDS) for order queue management, table configuration with floor plan layout, and order lifecycle tracking (open → preparing → ready → delivered → paid). Supports dine-in, takeout, and delivery order types.

**Value beyond CRUD:** This is a real-time operational system, not an entity CRUD. The table grid with drag-and-drop layout, kitchen queue with priority ordering, real-time order status updates, and multi-order management per table are all custom UI. Completely different from the appointment-based scheduling model.

## Custom Pages

### Orders Dashboard (`/orders`)

Multi-view dashboard:

| View | Route | Description |
|------|-------|-------------|
| Tables | `/orders` | Floor plan with table status grid |
| Kitchen | `/orders/kitchen` | Kitchen display system (KDS) |
| Orders | `/orders/list` | Order list with filters |
| Table Config | `/orders/tables` | Table configuration and layout |

### Table Grid View
- Visual floor plan with tables as cards
- Color-coded by status: available (green), occupied (yellow), waiting (red)
- Click table → open order panel
- Customer count per table
- Time since seated

### Kitchen Display System (KDS)
- Queue of orders sorted by time
- Items grouped by station (grill, cold, bar)
- Status: `new` → `preparing` → `ready`
- Bump to next status with click/tap
- Priority indicators for urgent orders

### Order Panel
- Add/remove items from menu
- Quantity adjustments
- Special instructions per item
- Split bill functionality
- Payment processing

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| main | 2 | Orders | `/orders` | `UtensilsCrossed` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/orders` | authenticated | Table grid / floor plan |
| `/orders/kitchen` | authenticated | Kitchen display |
| `/orders/list` | authenticated | Order list |
| `/orders/:id` | authenticated | Order detail |
| `/orders/tables` | authenticated | Table configuration |

### Widget Zones

**Injects into:**
- `shell.topbar.end` → Active orders count badge
- `shell.floating` → New order FAB (bottom-right)
- `clients.detail.tabs` → "Orders" tab (order history for this client)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Orders | Table layout, kitchen stations, order flow config, printer settings |

## Database Tables

### `restaurant_tables`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | Table name/number |
| zone | text | Floor area (indoor, outdoor, bar, etc.) |
| capacity | int | Max seats |
| status | text | `available`, `occupied`, `reserved`, `maintenance` |
| is_active | boolean | |
| created_at | timestamptz | |

### `table_positions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| table_id | uuid FK → restaurant_tables | |
| x | int | X position on floor plan |
| y | int | Y position on floor plan |
| width | int | |
| height | int | |
| shape | text | `square`, `round`, `rectangle` |

### `table_orders`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| table_id | uuid FK → restaurant_tables | Null for takeout/delivery |
| order_number | text | Sequential order number |
| type | text NOT NULL | `dine_in`, `takeout`, `delivery` |
| status | text NOT NULL | `open`, `preparing`, `ready`, `delivered`, `paid`, `cancelled` |
| customer_count | int | Number of diners |
| client_id | uuid FK → clients | Optional link |
| subtotal | numeric(12,2) | |
| discount | numeric(12,2) | |
| service_charge | numeric(12,2) | |
| total | numeric(12,2) | |
| notes | text | |
| delivery_address | jsonb | For delivery orders |
| opened_at | timestamptz | |
| closed_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `order_items`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| order_id | uuid FK → table_orders | |
| product_id | uuid FK → products | Menu item (product from inventory) |
| service_id | uuid FK → services | Alternative: service item |
| name | text NOT NULL | Item name at time of order |
| quantity | int NOT NULL | |
| unit_price | numeric(10,2) | |
| total | numeric(10,2) | |
| notes | text | Special instructions |
| status | text | `pending`, `preparing`, `ready`, `delivered`, `cancelled` |
| station | text | Kitchen station assignment |
| sent_to_kitchen_at | timestamptz | |
| prepared_at | timestamptz | |

### `kitchen_queue`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| order_id | uuid FK → table_orders | |
| order_item_id | uuid FK → order_items | |
| station | text | Kitchen station |
| priority | int | Higher = more urgent |
| status | text | `queued`, `preparing`, `ready`, `delivered` |
| queued_at | timestamptz | |
| started_at | timestamptz | |
| completed_at | timestamptz | |

### RPC Functions
- `sync_table_status_on_order()` — Trigger: update table status when order opens/closes
- `sync_order_totals()` — Trigger: recalculate order total when items change

## Key Workflows

### Dine-In Order
1. Customer seated → table status changes to `occupied`
2. Waiter opens order for table (customer count)
3. Adds items from menu
4. Items sent to kitchen → appear on KDS
5. Kitchen marks items as `preparing` → `ready`
6. Waiter marks as `delivered` to table
7. Customer requests bill → payment processed
8. Order status → `paid`, table → `available`

### Kitchen Queue (KDS)
1. New order items appear in queue sorted by time
2. Kitchen staff sees items grouped by station
3. Click to start preparing → status `preparing`
4. Click when done → status `ready`
5. Waiter/runner sees ready items → delivers to table
6. Items removed from queue when delivered

### Delivery Order
1. New order created with type `delivery`
2. Client info and delivery address captured
3. Items sent to kitchen
4. When ready, assigned to delivery
5. Status tracked: `preparing` → `ready` → `delivering` → `delivered`

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| OrdersDashboard | `src/pages/pedidos/OrdersDashboard.tsx` |
| OrderPanel | `src/pages/pedidos/components/OrderPanel.tsx` |
| TableGrid | `src/pages/pedidos/components/TableGrid.tsx` |
| TableConfigModal | `src/pages/pedidos/components/TableConfigModal.tsx` |
| MenuManager (used for item selection) | `src/pages/pedidos/components/MenuManager.tsx` |
