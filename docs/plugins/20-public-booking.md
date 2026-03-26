# Plugin: Online Booking
> Public booking wizard, client self-service portal, and availability management

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `public-booking` |
| **Scope** | `addon` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | `scheduling`, `services`, `staff` |

## Description

The public-booking plugin provides a public-facing, multi-step booking wizard where clients can book appointments without logging in. It also includes a client self-service portal for viewing/managing bookings and completing intake forms. The booking page is customizable per tenant and generates a shareable link.

**Value beyond CRUD:** Public routes (no auth), multi-step wizard UX, real-time availability checking against staff schedules and existing appointments, pending appointment system with 30-minute expiry to prevent double-booking, and edge function for API-based booking.

## Custom Pages

### Admin Pages

| View | Route | Description |
|------|-------|-------------|
| Booking Config | `/settings/booking` | Booking page settings |

### Public Pages (no auth)

| View | Route | Description |
|------|-------|-------------|
| Booking Wizard | `/book/:configId` | Multi-step booking |
| Client Portal | `/portal/:token` | Self-service portal |

### Booking Wizard Steps
1. **Select Service** — Browse available services by category
2. **Select Professional** — Choose preferred staff member (optional)
3. **Select Date/Time** — Calendar with available slots
4. **Client Info** — Name, phone, email (lookup existing or create new)
5. **Confirmation** — Review and confirm

## Integration Points

### Navigation (Sidebar)
None — settings-only + public pages.

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/settings/booking` | authenticated | Booking configuration |
| `/book/:configId` | public | Public booking wizard |
| `/book/:configId/confirm` | public | Booking confirmation |
| `/portal/:token` | public | Client self-service portal |

### Widget Zones

**Injects into:**
- `shell.topbar.end` → Copy booking link button (visible on `/agenda/*`)
- `clients.detail.tabs` → "Portal" tab (generate/manage access token)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Online Booking | Booking page config, available services, time slot rules, booking link |

## Database Tables

### `online_booking_configs`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| slug | text UNIQUE | Public URL identifier |
| name | text | Page title |
| description | text | Welcome message |
| logo_url | text | |
| theme | jsonb | Colors, layout |
| allowed_services | uuid[] | Service IDs available for booking (null = all) |
| allowed_staff | uuid[] | Staff IDs available (null = all) |
| slot_duration_minutes | int | Time slot granularity |
| advance_booking_days | int | How far ahead clients can book |
| min_advance_hours | int | Minimum hours before appointment |
| requires_confirmation | boolean | Whether bookings need staff confirmation |
| is_active | boolean | |
| created_at | timestamptz | |

### `pending_appointments`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| config_id | uuid FK → online_booking_configs | |
| client_phone | text | |
| client_name | text | |
| client_email | text | |
| service_id | uuid FK → services | |
| staff_id | uuid FK → staff_members | |
| start_time | timestamptz | |
| end_time | timestamptz | |
| status | text | `pending`, `confirmed`, `expired` |
| expires_at | timestamptz | 30-min expiry window |
| created_at | timestamptz | |

### `client_access_tokens`
Already defined in `clients` plugin — reused here for portal access.

## Edge Functions

### `public-booking`
API for the booking wizard:
1. `GET /services` — Available services for this config
2. `GET /staff` — Available staff
3. `GET /slots?date=&service_id=&staff_id=` — Available time slots
4. `POST /book` — Create pending appointment
5. `POST /confirm` — Confirm pending → create real appointment

Slot calculation:
1. Get staff schedule for the date
2. Subtract existing appointments and pending (non-expired) appointments
3. Apply slot_duration_minutes granularity
4. Return available slots

### `send-professional-invite`
Sends invitation to staff to join the platform (email-based).

## Key Workflows

### Online Booking Flow
1. Client visits `/book/:configId`
2. Selects service → selects professional → selects date/time
3. Enters contact info (phone lookup for existing clients)
4. Pending appointment created with 30-min expiry
5. If `requires_confirmation`: staff notified, must confirm
6. If auto-confirm: appointment created immediately
7. Client receives confirmation (WhatsApp if plugin active)

### Client Self-Service Portal
1. Admin generates access token for client
2. Token sent via WhatsApp/email
3. Client visits `/portal/:token`
4. Can view upcoming appointments
5. Can complete intake forms
6. Can update personal info

## RPC Functions
- `cleanup_expired_pending_appointments()` — Cron: remove expired pending slots

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| PublicBooking | `src/pages/public/PublicBooking.tsx` |
| ClientSelfService | `src/pages/public/ClientSelfService.tsx` |
| OnlineBookingConfig | `src/pages/marketing/OnlineBookingConfig.tsx` |
| Edge: public-booking | `supabase/functions/public-booking/index.ts` |
| Edge: send-professional-invite | `supabase/functions/send-professional-invite/index.ts` |
