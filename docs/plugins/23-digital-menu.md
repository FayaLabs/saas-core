# Plugin: Digital Menu
> Menu management, public digital menu, QR code access, and AI-powered menu import

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `digital-menu` |
| **Scope** | `niche` |
| **Niche** | `food` |
| **Default** | yes |
| **Min Plan** | `free` |
| **Dependencies** | `services`, `inventory` |

## Description

The digital-menu plugin provides menu management for food-service businesses and a public-facing digital menu accessible via QR code. It includes a visual menu editor with categories and items, a customizable public menu display, QR code generation, print-ready menu layouts, and AI-powered menu import from photos or PDFs.

**Value beyond CRUD:** The public digital menu is a client-facing UI with no auth. The menu editor is a visual drag-and-drop interface. AI menu import can extract items, prices, and categories from a photo of an existing physical menu. Menu items map to products from inventory and/or services.

## Custom Pages

### Admin Pages

| View | Route | Description |
|------|-------|-------------|
| Menu Editor | `/menu` | Visual menu editor with categories |
| Menu Detail | `/menu/:id` | Edit menu section/items |
| Print Preview | `/menu/print` | Print-ready menu layout |

### Public Pages (no auth)

| View | Route | Description |
|------|-------|-------------|
| Digital Menu | `/cardapio/:tenantSlug` | Public digital menu |

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 2 | Menu | `/menu` | `BookOpen` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/menu` | authenticated | Menu editor |
| `/menu/:id` | authenticated | Menu section editor |
| `/menu/print` | authenticated | Print preview |
| `/cardapio/:tenantSlug` | public | Public digital menu |

### Widget Zones

**Injects into:**
- `shell.topbar.end` → Menu link / QR code button
- `orders` → Menu item picker (when creating orders, items come from the menu)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Menu | Menu theme, display options, QR code config, public URL |

## Database Tables

### `menus`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | Menu name (e.g., "Lunch", "Dinner", "Drinks") |
| slug | text | Public URL slug |
| is_active | boolean | |
| theme | jsonb | Colors, fonts, layout style |
| header_image_url | text | Menu banner image |
| sort_order | int | |
| created_at | timestamptz | |

### `menu_sections`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| menu_id | uuid FK → menus | |
| name | text NOT NULL | Section name (e.g., "Starters", "Main Course") |
| description | text | |
| sort_order | int | |
| is_visible | boolean | |

### `menu_items`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| section_id | uuid FK → menu_sections | |
| product_id | uuid FK → products | Link to inventory product |
| service_id | uuid FK → services | Alternative: link to service |
| name | text NOT NULL | Display name |
| description | text | |
| price | numeric(10,2) | |
| image_url | text | |
| is_available | boolean | Currently available |
| is_highlighted | boolean | Featured item |
| allergens | text[] | Allergen tags |
| dietary_tags | text[] | `vegetarian`, `vegan`, `gluten_free`, etc. |
| sort_order | int | |

### `menu_item_options`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| item_id | uuid FK → menu_items | |
| group_name | text NOT NULL | Option group (e.g., "Size", "Extra toppings") |
| name | text NOT NULL | Option name |
| price_adjustment | numeric(10,2) | Additional cost |
| is_default | boolean | |
| sort_order | int | |

## Edge Functions

### `ai-menu-extract`
AI-powered menu import:
1. Accepts image or PDF of physical menu
2. Sends to vision AI (OpenAI GPT-4V or Claude)
3. Extracts: item names, descriptions, prices, categories
4. Returns structured data for review
5. User confirms → items created in menu + optionally in inventory

## Key Workflows

### Creating a Menu
1. Navigate to `/menu`
2. Create menu (e.g., "Lunch Menu")
3. Add sections (e.g., "Starters", "Main Course", "Desserts")
4. Add items to sections with name, description, price, photo
5. Link items to inventory products (for stock tracking)
6. Set theme and activate
7. Generate QR code for tables

### AI Menu Import
1. Click "Import Menu" on menu editor
2. Upload photo of physical menu
3. AI extracts items with prices and categories
4. Review and edit extracted data
5. Confirm → items bulk-created
6. Optionally create matching inventory products

### Public Menu Access
1. Customer scans QR code at table
2. Opens `/cardapio/:tenantSlug` in browser
3. Sees categorized menu with photos and prices
4. Dietary filters available (vegetarian, vegan, etc.)
5. Can toggle between different menus (lunch/dinner)

### Menu Printing
1. Navigate to `/menu/print`
2. Select menu to print
3. Preview in print-ready layout
4. Print or export as PDF

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| MenuManager | `src/pages/pedidos/components/MenuManager.tsx` |
| MenuCategoryCard | `src/pages/pedidos/components/MenuCategoryCard.tsx` |
| MenuPrintModal | `src/pages/pedidos/components/MenuPrintModal.tsx` |
| MenuPrintRenderer | `src/pages/pedidos/components/MenuPrintRenderer.tsx` |
| AIMenuImportModal | `src/pages/pedidos/components/AIMenuImportModal.tsx` |
| PublicMenu | `src/pages/public/PublicMenu.tsx` |
| Edge: ai-menu-extract | `supabase/functions/ai-menu-extract/index.ts` |
