# Plugin: Clients & Contacts
> Unified customer, supplier, and partner management with detail page tab injection

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `clients` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | yes |
| **Min Plan** | `free` |
| **Dependencies** | — |

## Description

The clients plugin is the central person/entity registry for any SaaS vertical. It manages clients (customers), suppliers, partners, and leads in a unified contact database differentiated by `contact_type`.

**Value beyond CRUD:** The list page uses `createCrudPage()` for standard CRUD operations. The real value is the **detail page** (`/clients/:id`) — a tabbed interface where other plugins inject contextual tabs (appointments, payments, journey, etc.). This makes the client detail page a hub for all cross-plugin data about a person.

The plugin also provides:
- Client photo gallery and file storage
- Professional notes per client
- Client self-service portal access tokens
- Contact type switching (client/supplier/partner/lead)
- Client-specific warnings and colored identification tags

## CRUD

Uses `createCrudPage(clientsEntityDef)` for the list + create/edit forms.

### EntityDef Schema

```ts
const clientsEntityDef: EntityDef = {
  name: 'Client',
  namePlural: 'Clients',
  icon: 'Users',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, showInTable: true, searchable: true },
    { key: 'social_name', label: 'Preferred Name', type: 'text', showInTable: false },
    { key: 'email', label: 'Email', type: 'email', showInTable: true, searchable: true },
    { key: 'phone', label: 'Phone', type: 'phone', showInTable: true, searchable: true },
    { key: 'mobile', label: 'Mobile', type: 'phone', showInTable: false },
    { key: 'birth_date', label: 'Birth Date', type: 'date', showInTable: false },
    { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other', 'prefer_not_to_say'] },
    { key: 'contact_type', label: 'Type', type: 'select', options: ['client', 'supplier', 'partner', 'lead'], defaultValue: 'client', showInTable: true },
    { key: 'cpf', label: 'CPF', type: 'text' },
    { key: 'rg', label: 'RG', type: 'text' },
    { key: 'postal_code', label: 'Postal Code', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'neighborhood', label: 'Neighborhood', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'country', label: 'Country', type: 'text', defaultValue: 'BR' },
    { key: 'profession', label: 'Profession', type: 'text' },
    { key: 'origin', label: 'Origin', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
    { key: 'warnings', label: 'Warnings', type: 'textarea' },
    { key: 'identification_color', label: 'Tag Color', type: 'text' },
    { key: 'avatar_url', label: 'Avatar', type: 'image' },
  ],
  data: {
    table: 'clients',
    tenantScoped: true,
    tenantIdColumn: 'company_id',
    searchColumns: ['name', 'email', 'phone', 'mobile', 'cpf'],
  },
  defaultSort: 'name',
  displayField: 'name',
  imageField: 'avatar_url',
}
```

## Custom Pages

### Client Detail Page (`/clients/:id`)

A tabbed detail page that serves as the hub for all client-related data. Built-in tabs:

| Tab | Description |
|-----|-------------|
| **Overview** | Basic info, avatar, warnings, identification color |
| **Photos** | Photo gallery with folders |
| **Files** | Document storage with folders |
| **Notes** | Professional service notes (per-appointment) |

### Exposed Widget Zone: `clients.detail.tabs`

Other plugins inject tabs here. Expected injections:
- `scheduling` → "Appointments" tab (appointment history, upcoming)
- `financial` → "Payments" tab (invoices, payment history)
- `beauty-journey` → "Journey" tab (service journey with before/after photos)
- `crm` → "Quotes" tab (quotes and sales journey)
- `custom-forms` → "Forms" tab (completed form responses)
- `contracts` → "Contracts" tab (signed contracts)

### Exposed Widget Zone: `clients.detail.sidebar`

Sidebar widgets on the client detail page for quick stats:
- `scheduling` → Next appointment card
- `financial` → Account balance card

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| main | 1 | Clients | `/clients` | `Users` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/clients` | authenticated | Client list (createCrudPage) |
| `/clients/new` | authenticated | Create client form (createCrudPage) |
| `/clients/:id` | authenticated | Client detail page (custom) |
| `/clients/:id/edit` | authenticated | Edit client form (createCrudPage) |

### Widget Zones

**Exposes:**
- `clients.detail.tabs` — Tab injection point on client detail page
- `clients.detail.sidebar` — Sidebar widgets on client detail page

**Injects into:**
- `shell.topbar.start` — Client quick-search widget (if `global-search` not active)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Clients | Default fields, required fields, import/export config, origin list |

## Database Tables

### `clients`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | Tenant scoping |
| name | text NOT NULL | Full name |
| social_name | text | Preferred/social name |
| email | text | |
| phone | text | Landline |
| mobile | text | Mobile phone |
| birth_date | date | |
| gender | text | male/female/other/prefer_not_to_say |
| contact_type | text | client/supplier/partner/lead |
| cpf | text | Brazilian tax ID |
| rg | text | Brazilian ID card |
| postal_code | text | |
| address | text | |
| neighborhood | text | |
| city | text | |
| state | text | |
| country | text | Default 'BR' |
| profession | text | |
| origin | text | Lead source |
| referral | text | Who referred them |
| notes | text | |
| warnings | text | |
| identification_color | text | Visual tag color |
| avatar_url | text | |
| normalized_name | text | Accent-stripped for search |
| skin_color | text | (beauty vertical) |
| hair_color | text | (beauty vertical) |
| hair_type | text | (beauty vertical) |
| education | text | |
| nationality | text | |
| marital_status | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `client_photos`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| folder_id | uuid FK → client_photo_folders | Optional folder |
| url | text NOT NULL | Storage URL |
| caption | text | |
| taken_at | timestamptz | |
| created_at | timestamptz | |

### `client_photo_folders`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| name | text NOT NULL | Folder name |
| created_at | timestamptz | |

### `client_files`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| folder_id | uuid FK → client_file_folders | Optional folder |
| url | text NOT NULL | Storage URL |
| name | text NOT NULL | Display name |
| mime_type | text | |
| size_bytes | bigint | |
| created_at | timestamptz | |

### `client_file_folders`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| name | text NOT NULL | |
| created_at | timestamptz | |

### `client_service_notes`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| appointment_id | uuid FK → appointments | Optional link |
| professional_id | uuid FK → professionals | Who wrote the note |
| content | text NOT NULL | Note body |
| summary | text | AI-generated summary |
| created_at | timestamptz | |

### `client_access_tokens`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| token | text UNIQUE | Self-service portal token |
| expires_at | timestamptz | |
| created_at | timestamptz | |

### `origins`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | Origin name (Instagram, Google, Referral, etc.) |
| created_at | timestamptz | |

### RPC Functions
- `normalize_text(text)` — Strips accents for Portuguese search
- `search_clients_normalized(text, uuid)` — Search clients by normalized name within a tenant
- `sync_client_to_account_central_insert()` — Trigger: sync new client to account_central
- `sync_client_to_account_central_update()` — Trigger: sync client updates

### Storage Buckets
- `client-photos` — Client photo gallery
- `client-files` — Client documents

## Key Workflows

### Client Creation
1. User opens `/clients/new` (createCrudPage form)
2. Fills required fields (name at minimum)
3. On save, trigger `sync_client_to_account_central_insert()` creates an account_central entry
4. Redirect to client detail page `/clients/:id`

### Client Detail Navigation
1. User clicks a client row in the list
2. Detail page loads with Overview tab active
3. Other tabs populated by injected plugins (Appointments, Payments, Journey, etc.)
4. Sidebar widgets show quick stats (next appointment, balance)

### Client Self-Service Portal
1. Admin generates access token for a client
2. Token is sent via WhatsApp or email
3. Client accesses `/client/:token` (public route)
4. Can view/update profile, complete forms, view upcoming appointments

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| ClientList | `src/pages/clientes/ClientList.tsx` |
| ClientForm | `src/pages/clientes/components/ClientForm.tsx` |
| ClientTabs | `src/pages/clientes/components/ClientTabs.tsx` |
| ClientPhotos | `src/pages/clientes/components/ClientPhotos.tsx` |
| ClientFiles | `src/pages/clientes/components/ClientFiles.tsx` |
| ClientServiceNotes | `src/pages/clientes/components/ClientServiceNotes.tsx` |
| ClientAppointments | `src/pages/clientes/components/ClientAppointments.tsx` |
| ClientAccount | `src/pages/clientes/components/ClientAccount.tsx` |
| ClientSelfService | `src/pages/public/ClientSelfService.tsx` |
| GlobalSearch | `src/components/GlobalSearch.tsx` |
