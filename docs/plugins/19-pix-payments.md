# Plugin: PIX Payments
> Brazilian instant payment system (PIX) integration for receiving payments

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `pix-payments` |
| **Scope** | `addon` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | `financial` |

## Description

The PIX payments plugin integrates with the Brazilian instant payment system (PIX) for receiving payments. It generates PIX QR codes for invoices, handles payment confirmation webhooks, and auto-reconciles payments with invoices in the financial plugin.

**Value beyond CRUD:** This is a payment integration plugin. It provides QR code generation, payment status webhooks, and automatic invoice reconciliation. Injects a "Pay with PIX" button into invoice detail pages.

## Integration Points

### Navigation (Sidebar)
None — integration-only plugin.

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/settings/pix` | authenticated | PIX configuration |

### Widget Zones

**Injects into:**
- Financial invoice detail → "Pay with PIX" button / QR code display
- `shell.topbar.end` → PIX payment notification indicator

### Settings Tabs
| Tab | Description |
|-----|-------------|
| PIX | API credentials, PIX key configuration, webhook URL |

## Database Tables

### `pix_configs`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| provider | text | `mercado_pago`, `pagarme`, `asaas`, `manual` |
| api_key | text | Encrypted |
| pix_key | text | PIX key (CPF, CNPJ, email, phone, random) |
| pix_key_type | text | `cpf`, `cnpj`, `email`, `phone`, `random` |
| webhook_url | text | Auto-generated |
| is_active | boolean | |
| created_at | timestamptz | |

### `pix_transactions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| invoice_id | uuid FK → invoices | Linked invoice |
| amount | numeric(12,2) NOT NULL | |
| status | text | `pending`, `paid`, `expired`, `refunded` |
| qr_code | text | PIX QR code string |
| qr_code_url | text | QR code image URL |
| txid | text | PIX transaction ID |
| end_to_end_id | text | PIX E2E ID (from Central Bank) |
| payer_name | text | |
| payer_document | text | CPF/CNPJ |
| paid_at | timestamptz | |
| expires_at | timestamptz | |
| created_at | timestamptz | |

## Edge Functions

### `pix-webhook`
Receives payment confirmations from PIX provider:
1. Validates webhook signature
2. Finds matching `pix_transactions` by txid
3. Updates status to `paid`
4. Creates `financial_movement` in financial plugin
5. Updates invoice payment status via `sync_invoice_payment_status()`

### `pix-generate`
Generates PIX QR code for an invoice:
1. Calls PIX provider API with amount and description
2. Receives QR code and txid
3. Stores in `pix_transactions`
4. Returns QR code for display

## Key Workflows

### PIX Payment for Invoice
1. Client has an unpaid invoice
2. Staff clicks "Pay with PIX" on invoice detail
3. `pix-generate` edge function creates QR code
4. QR code displayed on screen (or sent via WhatsApp)
5. Client scans and pays
6. `pix-webhook` receives confirmation
7. Invoice automatically marked as paid

## Beautyplace Source Reference

This is a new plugin. Beautyplace has payment method support but no direct PIX integration. This extends the financial plugin's payment capabilities with:
- Payment method types (`src/pages/financeiro/`)
- Financial movement creation patterns
