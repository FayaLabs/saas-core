# Plugin: E-Commerce
> Online product catalog, shopping cart, and checkout flow

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `ecommerce` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `pro` |
| **Dependencies** | `inventory`, `clients` |

## Description

The ecommerce plugin provides a public-facing product catalog with shopping cart and checkout functionality. Clients can browse products from the inventory, add to cart, and complete purchases. This plugin bridges the inventory system with client-facing sales, distinct from in-person service sales.

**Value beyond CRUD:** Public storefront UI (no auth required), cart state management, checkout flow with payment integration, and order tracking. This is a future-facing plugin for businesses that want to sell products online (beauty products, meal kits, merchandise).

## Custom Pages

### Admin Pages

| View | Route | Description |
|------|-------|-------------|
| Store Settings | `/ecommerce/settings` | Storefront config, payment, shipping |
| Orders | `/ecommerce/orders` | Online order management |
| Order Detail | `/ecommerce/orders/:id` | Order detail with status |

### Public Pages (no auth)

| View | Route | Description |
|------|-------|-------------|
| Storefront | `/store/:tenantSlug` | Public product catalog |
| Product | `/store/:tenantSlug/product/:id` | Product detail |
| Cart | `/store/:tenantSlug/cart` | Shopping cart |
| Checkout | `/store/:tenantSlug/checkout` | Checkout flow |

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 7 | E-Commerce | `/ecommerce/orders` | `ShoppingCart` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/ecommerce/orders` | authenticated | Order management |
| `/ecommerce/orders/:id` | authenticated | Order detail |
| `/ecommerce/settings` | authenticated | Store settings |
| `/store/:tenantSlug` | public | Public storefront |
| `/store/:tenantSlug/product/:id` | public | Product detail |
| `/store/:tenantSlug/cart` | public | Cart |
| `/store/:tenantSlug/checkout` | public | Checkout |

### Widget Zones

**Injects into:**
- `clients.detail.tabs` → "Orders" tab (online order history)
- `inventory.product.detail.tabs` → "E-Commerce" tab (online sales config, visibility)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| E-Commerce | Storefront config, shipping options, payment gateway |

## Database Tables

### `store_configs`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| slug | text UNIQUE | Public URL slug |
| name | text | Store display name |
| description | text | |
| logo_url | text | |
| theme | jsonb | Color scheme, layout options |
| is_active | boolean | |
| shipping_config | jsonb | Shipping methods and fees |
| payment_config | jsonb | Payment gateway settings |
| created_at | timestamptz | |

### `product_sale_channels`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| product_id | uuid FK → products | |
| channel | text | `store`, `in_person` |
| is_visible | boolean | |
| online_price | numeric(10,2) | May differ from in-store price |

### `online_orders`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| client_id | uuid FK → clients | Optional (guest checkout) |
| order_number | text UNIQUE | Human-readable order number |
| status | text | `pending`, `confirmed`, `preparing`, `shipped`, `delivered`, `cancelled` |
| subtotal | numeric(12,2) | |
| shipping_fee | numeric(10,2) | |
| total | numeric(12,2) | |
| shipping_address | jsonb | |
| payment_method | text | |
| payment_status | text | `pending`, `paid`, `refunded` |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `online_order_items`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| order_id | uuid FK → online_orders | |
| product_id | uuid FK → products | |
| quantity | int NOT NULL | |
| unit_price | numeric(10,2) | |
| total | numeric(10,2) | |

## Key Workflows

### Online Purchase
1. Client visits `/store/:tenantSlug`
2. Browses products, adds to cart
3. Proceeds to checkout
4. Provides contact info and shipping address
5. Selects payment method
6. Order created with status `pending`
7. Stock deducted from inventory
8. Admin notified of new order

## Beautyplace Source Reference

This is a new plugin not directly present in beautyplace. It extends concepts from:
- Product catalog (`src/pages/estoque/`)
- Product sale channels and sale info tables
- Public-facing pages pattern (`src/pages/public/`)
