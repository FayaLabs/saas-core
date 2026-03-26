# Plugin: Custom Forms
> Drag-and-drop form builder, client-facing form filler, and response tracking

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `custom-forms` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | — |

## Description

The custom-forms plugin provides a form builder for creating intake forms, health questionnaires, feedback surveys, and any other structured data collection. Forms are built with a drag-and-drop editor and can be linked to services (filled during service execution) or sent to clients via their self-service portal.

**Value beyond CRUD:** The form builder is a specialized editor with field types, validation rules, conditional logic, and a preview mode. The form filler component renders forms dynamically and stores responses. Injects "Default Forms" tab into `services.detail.tabs` and "Forms" tab into `clients.detail.tabs`.

## Custom Pages

### Forms Dashboard (`/forms`)

| View | Route | Description |
|------|-------|-------------|
| Forms | `/forms` | Form template list |
| Editor | `/forms/:id/edit` | Drag-and-drop form builder |
| Responses | `/forms/:id/responses` | Response list for a form |

### Form Builder

Field types supported:
- Text (short, long)
- Number
- Date / DateTime
- Select (single, multi)
- Checkbox
- Radio
- File upload
- Signature
- Header / Paragraph (decorative)

Each field has:
- Label, placeholder, help text
- Required flag
- Validation rules (min/max, pattern)
- Conditional visibility (show if field X = value)

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 3 | Forms | `/forms` | `ClipboardList` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/forms` | authenticated | Form template list |
| `/forms/new` | authenticated | Create form |
| `/forms/:id/edit` | authenticated | Form builder |
| `/forms/:id/responses` | authenticated | Response list |
| `/forms/:id/fill` | authenticated | Fill form (staff-facing) |

### Widget Zones

**Injects into:**
- `services.detail.tabs` → "Default Forms" tab (forms to fill during this service)
- `clients.detail.tabs` → "Forms" tab (completed form responses)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Forms | Default form settings, field type configuration |

## Database Tables

### `form_templates`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| description | text | |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `form_template_fields`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| template_id | uuid FK → form_templates | |
| field_type | text NOT NULL | `text`, `textarea`, `number`, `date`, `select`, `multiselect`, `checkbox`, `radio`, `file`, `signature`, `header`, `paragraph` |
| label | text NOT NULL | |
| placeholder | text | |
| help_text | text | |
| required | boolean | Default false |
| options | jsonb | For select/radio/checkbox |
| validation | jsonb | min, max, pattern, etc. |
| conditional | jsonb | Show/hide conditions |
| sort_order | int NOT NULL | Field ordering |

### `client_form_responses`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| template_id | uuid FK → form_templates | |
| client_id | uuid FK → clients | |
| appointment_id | uuid FK → appointments | Optional link |
| responses | jsonb NOT NULL | `{ field_id: value }` map |
| submitted_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## Key Workflows

### Creating a Form
1. Navigate to `/forms/new`
2. Drag and drop fields into the form canvas
3. Configure each field (label, type, required, validation)
4. Preview the form
5. Save and activate

### Linking Form to Service
1. Navigate to service detail → "Default Forms" tab
2. Select form template(s) to attach
3. Mark as required or optional
4. During service execution, attached forms are prompted

### Client Fills Form
1. During appointment or via self-service portal
2. Form filler renders fields dynamically
3. Client completes and submits
4. Response stored in `client_form_responses`
5. Visible in client detail → "Forms" tab

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| FormTemplatesList | `src/pages/configuracoes/formularios/FormTemplatesList.tsx` |
| FormTemplateEditor | `src/pages/configuracoes/formularios/FormTemplateEditor.tsx` |
| FormFiller | `src/components/FormFiller.tsx` |
| FieldPropertiesPanel | `src/pages/configuracoes/formularios/components/FieldPropertiesPanel.tsx` |
