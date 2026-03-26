# Plugin: Contracts & Documents
> Contract template management, service-linked generation, and digital signatures

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `contracts` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | `clients`, `services` |

## Description

The contracts plugin manages contract templates, generates contracts from templates with dynamic variable substitution, tracks digital signatures, and links contracts to services and invoices. Useful for beauty salons (service agreements, liability waivers), consulting (engagement letters), or any business requiring documented agreements.

**Value beyond CRUD:** Template builder with tag system for dynamic content, PDF generation, signature capture (photo + selfie), and contract lifecycle tracking (draft → sent → signed → expired). Injects a "Contracts" tab into `clients.detail.tabs`.

## Custom Pages

### Contracts Dashboard (`/contracts`)

| View | Route | Description |
|------|-------|-------------|
| Contracts | `/contracts` | List of generated contracts with status |
| Templates | `/contracts/templates` | Contract template management |
| Template Editor | `/contracts/templates/:id` | Rich text editor with tag insertion |

### Contract Template Editor

Rich text editor with insertable tags:
- `{{client.name}}`, `{{client.cpf}}`, `{{client.address}}`
- `{{service.name}}`, `{{service.price}}`
- `{{company.name}}`, `{{company.address}}`
- `{{date.today}}`, `{{date.expiry}}`

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 4 | Contracts | `/contracts` | `FileText` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/contracts` | authenticated | Contract list |
| `/contracts/:id` | authenticated | Contract detail/view |
| `/contracts/templates` | authenticated | Template management |
| `/contracts/templates/:id` | authenticated | Template editor |

### Widget Zones

**Injects into:**
- `clients.detail.tabs` → "Contracts" tab (signed contracts for this client)
- `financial` → Invoice contracts bar (linked contracts on invoice detail)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Contracts | Default terms, signature requirements, expiry settings |

## Database Tables

### `contract_templates`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| body | text NOT NULL | Rich text with `{{tags}}` |
| tags | text[] | Available tags in this template |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `contract_template_services`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| template_id | uuid FK → contract_templates | |
| service_id | uuid FK → services | Auto-generate this contract for this service |

### `generated_contracts`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| template_id | uuid FK → contract_templates | |
| client_id | uuid FK → clients | |
| invoice_id | uuid FK → invoices | Optional link |
| rendered_body | text | Final rendered content |
| status | text | `draft`, `sent`, `signed`, `expired`, `cancelled` |
| signed_at | timestamptz | |
| signature_url | text | Signature image URL |
| selfie_url | text | Selfie verification URL |
| expires_at | timestamptz | |
| created_at | timestamptz | |

### RPC Functions
- `link_contracts_to_invoice_on_item_insert()` — Trigger: auto-link service contracts to invoice

### Storage Buckets
- `contract-signatures` — Signature images and selfie verification photos

## Key Workflows

### Contract Generation
1. Service is linked to a contract template
2. When invoice is created for that service, contract auto-generates
3. Template tags replaced with actual client/service/company data
4. Contract appears in client's "Contracts" tab

### Digital Signature
1. Contract is sent to client (email or shown on tablet)
2. Client signs (drawing signature on screen)
3. Optional selfie for identity verification
4. Contract status moves to `signed`

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| ContractTemplatesList | `src/pages/configuracoes/contratos/ContractTemplatesList.tsx` |
| ContractTemplateForm | `src/pages/configuracoes/contratos/ContractTemplateForm.tsx` |
| ContractSignatureModal | `src/components/ContractSignatureModal.tsx` |
| ContractTagsBar | `src/components/ContractTagsBar.tsx` |
| InvoiceContractsBar | `src/pages/financeiro/components/InvoiceContractsBar.tsx` |
