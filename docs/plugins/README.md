# Plugin Specs

Each plugin is documented in its own file below. These specs are designed to be handed to an AI agent for implementation.

## Architecture

```
Apps:       beauty-saas                    resto-saas
              |                               |
         usePlugins([...])              usePlugins([...])
              |                               |
Plugins:  @fayz/plugins  (scheduling, digital-menu, orders, ecommerce, whatsapp, pix-payments, analytics, ...)
              |
Core:     @fayz/saas-core  (createSaasApp, createCrudPage, usePlugin, Auth+RLS, Tenant ctx, Billing, UI shell, i18n)
```

## Design Principles

1. **CRUD Reuse** - Entity-centric plugins use `createCrudPage(entityDef)` from saas-core. Never reimplement list/form CRUD.
2. **Detail Page Tab Injection** - Entity plugins expose a widget zone `<plugin-id>.detail.tabs` on their detail page. Other plugins inject tabs into it.
3. **Value Beyond CRUD** - Plugins earn their existence with custom detail pages, specialized workflows, integrations, or vertical-specific logic.

## Plugin Registry

### Cross-Niche (scope: `cross-niche`)

| # | Plugin ID | Name | Default | Dependencies | Spec |
|---|-----------|------|---------|-------------|------|
| 1 | `clients` | Clients & Contacts | yes | — | [01-clients.md](01-clients.md) |
| 2 | `staff` | Staff & Professionals | yes | — | [02-staff.md](02-staff.md) |
| 3 | `services` | Services Catalog | yes | — | [03-services.md](03-services.md) |
| 4 | `scheduling` | Scheduling & Agenda | yes | `clients`, `staff`, `services` | [04-scheduling.md](04-scheduling.md) |
| 5 | `financial` | Financial Management | yes | `clients` | [05-financial.md](05-financial.md) |
| 6 | `inventory` | Inventory & Stock | no | — | [06-inventory.md](06-inventory.md) |
| 7 | `analytics` | Analytics & Reports | yes | — | [07-analytics.md](07-analytics.md) |
| 8 | `marketing` | Marketing & Communications | no | `clients` | [08-marketing.md](08-marketing.md) |
| 9 | `contracts` | Contracts & Documents | no | `clients`, `services` | [09-contracts.md](09-contracts.md) |
| 10 | `custom-forms` | Custom Forms | no | — | [10-custom-forms.md](10-custom-forms.md) |
| 11 | `pricing` | Pricing & Price Tables | no | `services` | [11-pricing.md](11-pricing.md) |
| 12 | `commissions` | Commissions | no | `staff`, `services`, `financial` | [12-commissions.md](12-commissions.md) |
| 13 | `crm` | CRM & Sales Pipeline | no | `clients` | [13-crm.md](13-crm.md) |
| 14 | `global-search` | Global Search | yes | — | [14-global-search.md](14-global-search.md) |
| 15 | `equipment` | Equipment & Assets | no | — | [15-equipment.md](15-equipment.md) |
| 16 | `field-config` | Field Configuration | no | — | [16-field-config.md](16-field-config.md) |
| 17 | `ecommerce` | E-Commerce | no | `inventory`, `clients` | [17-ecommerce.md](17-ecommerce.md) |

### Addon (scope: `addon`)

| # | Plugin ID | Name | Default | Dependencies | Spec |
|---|-----------|------|---------|-------------|------|
| 18 | `whatsapp` | WhatsApp Integration | no | `clients` | [18-whatsapp.md](18-whatsapp.md) |
| 19 | `pix-payments` | PIX Payments | no | `financial` | [19-pix-payments.md](19-pix-payments.md) |
| 20 | `public-booking` | Online Booking | no | `scheduling`, `services`, `staff` | [20-public-booking.md](20-public-booking.md) |

### Niche (scope: `niche`)

| # | Plugin ID | Name | Niche | Default | Dependencies | Spec |
|---|-----------|------|-------|---------|-------------|------|
| 21 | `beauty-journey` | Beauty Journey | beauty | yes | `clients`, `services`, `scheduling` | [21-beauty-journey.md](21-beauty-journey.md) |
| 22 | `orders` | Orders & Delivery | food | yes | `services`, `inventory` | [22-orders.md](22-orders.md) |
| 23 | `digital-menu` | Digital Menu | food | yes | `services`, `inventory` | [23-digital-menu.md](23-digital-menu.md) |

## Dependency DAG

```
(no deps)       clients    staff    services    inventory    custom-forms    equipment    field-config    global-search    analytics    dashboard
                 / | \       |       / | \          |
                /  |  \      |      /  |  \         |
           crm marketing  scheduling pricing contracts ecommerce
                |          /  |  \
             whatsapp  financial booking  beauty-journey(beauty)
                          |              orders(food)  digital-menu(food)
                     commissions
                     pix-payments
```

## Vertical Default Plugins

### beauty-saas
```ts
usePlugins(['clients', 'staff', 'services', 'scheduling', 'financial',
            'analytics', 'global-search', 'beauty-journey'])
```

### resto-saas
```ts
usePlugins(['clients', 'staff', 'services', 'inventory', 'financial',
            'analytics', 'global-search', 'orders', 'digital-menu'])
```
