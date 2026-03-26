# Plugin: Beauty Journey
> Client service journey with before/after photos, revisions, and professional notes

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `beauty-journey` |
| **Scope** | `niche` |
| **Niche** | `beauty` |
| **Default** | yes |
| **Min Plan** | `free` |
| **Dependencies** | `clients`, `services`, `scheduling` |

## Description

The beauty-journey plugin is the core differentiator for beauty-vertical SaaS. It tracks the complete service journey for each client: before/after photos per visit, service revisions (e.g., hair color adjustments over time), professional notes per session, and a visual timeline of treatments. This creates a rich client history that helps professionals deliver personalized service.

**Value beyond CRUD:** Visual photo timeline with before/after comparison, service revision tracking with form responses, professional notes with AI summaries, and a journey view that aggregates data from appointments, services, and photos into a coherent treatment history.

## Custom Pages

### Journey Dashboard (`/journeys`)

List of clients with their journey summaries. Click to see a client's full journey.

### Client Journey Page (`/journeys/:clientId`)

A visual timeline showing:
- Each visit with date, services performed, professional
- Before/after photos per visit
- Service revisions and form responses
- Professional notes and observations
- Treatment progression over time

### Journey Entry Detail (`/journeys/:clientId/entry/:entryId`)

Deep dive into a single visit:
- All photos (before, during, after)
- Services performed with revision details
- Products used
- Professional notes with transcription summaries
- Linked forms and responses

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| main | 8 | Journeys | `/journeys` | `Camera` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/journeys` | authenticated | Journey dashboard |
| `/journeys/:clientId` | authenticated | Client journey timeline |
| `/journeys/:clientId/entry/:entryId` | authenticated | Journey entry detail |

### Widget Zones

**Injects into:**
- `clients.detail.tabs` → "Journey" tab (service journey timeline)
- `clients.detail.sidebar` → Latest journey photo card
- `scheduling.appointment.sidebar` → Previous journey entry for context
- `page.after` → Journey summary card (visible on `/clients/:id`)

## Database Tables

### `service_revisions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| appointment_id | uuid FK → appointments | |
| client_id | uuid FK → clients | |
| service_id | uuid FK → services | |
| staff_id | uuid FK → staff_members | |
| revision_number | int | 1st visit, 2nd visit, etc. |
| notes | text | Revision-specific notes |
| created_at | timestamptz | |

### `service_revision_forms`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| revision_id | uuid FK → service_revisions | |
| form_template_id | uuid FK → form_templates | |
| responses | jsonb | Form response data |
| completed_at | timestamptz | |

### `journey_photos`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| appointment_id | uuid FK → appointments | |
| revision_id | uuid FK → service_revisions | |
| type | text | `before`, `during`, `after` |
| url | text NOT NULL | Storage URL |
| caption | text | |
| taken_at | timestamptz | |
| created_at | timestamptz | |

### `client_service_notes`
Already defined in `clients` plugin. Used here for professional notes per journey entry:
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| appointment_id | uuid FK → appointments | |
| professional_id | uuid FK → staff_members | |
| content | text NOT NULL | |
| summary | text | AI-generated summary |
| created_at | timestamptz | |

### Beauty-Specific Client Fields
The `clients` table includes optional beauty-specific fields that this plugin leverages:
- `skin_color` — Client's skin type/color
- `hair_color` — Current hair color
- `hair_type` — Hair type (straight, curly, wavy, coily)

These fields are visible in the journey context for treatment planning.

## Key Workflows

### Recording a Journey Entry
1. Appointment starts → professional takes "before" photos
2. During service, records products used and revision notes
3. Optionally fills service-specific forms (e.g., color formula)
4. After service → takes "after" photos
5. Adds professional notes/observations
6. Journey entry saved, linked to appointment and revision

### Viewing Client Journey
1. Navigate to client detail → "Journey" tab
2. Timeline shows all visits chronologically
3. Each entry shows before/after photo thumbnails
4. Click to expand → full photos, notes, forms
5. Useful for consultation: "Last time we used X formula"

### Photo Comparison
1. On journey timeline, select two entries
2. Side-by-side comparison of before/after photos
3. Visual treatment progression tracking

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| ClientServiceJourney | `src/pages/clientes/components/ClientServiceJourney.tsx` |
| ClientServiceNotes | `src/pages/clientes/components/ClientServiceNotes.tsx` |
| ClientPhotos | `src/pages/clientes/components/ClientPhotos.tsx` |
| ServiceRevisionForms | `src/pages/servicos/components/ServiceRevisionForms.tsx` |
| ServiceExecutionPanel | `src/pages/agenda/components/ServiceExecutionPanel.tsx` |
