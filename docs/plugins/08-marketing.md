# Plugin: Marketing & Communications
> Message templates, automated event triggers, and multi-channel dispatch

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `marketing` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | `clients` |

## Description

The marketing plugin provides a communication engine for automated and manual messaging to clients. It manages message templates, automation rules (triggered by business events like birthdays, appointment reminders, follow-ups), and dispatch logging. The plugin is **channel-agnostic** — it prepares messages and delegates actual delivery to channel plugins (e.g., `whatsapp` plugin for WhatsApp, email for email).

**Value beyond CRUD:** This is an automation engine, not a simple entity CRUD. It provides a template builder with variable substitution (e.g., `{{client.name}}`, `{{appointment.date}}`), event-driven triggers, and a dispatch log for tracking delivery status.

## Custom Pages

### Marketing Dashboard (`/marketing`)

Multi-view with sidebar navigation:

| View | Route | Description |
|------|-------|-------------|
| Overview | `/marketing` | Campaign stats, recent dispatches |
| Templates | `/marketing/templates` | Message template library |
| Automations | `/marketing/automations` | Event-based automation rules |
| Dispatch Log | `/marketing/log` | Message send history with status |

### Automation Events

Pre-built event types that trigger messages:

| Event | Trigger | Template Variables |
|-------|---------|-------------------|
| Birthday | Client birth_date matches today | `{{client.name}}`, `{{client.birth_date}}` |
| Appointment Reminder | X hours before appointment | `{{client.name}}`, `{{appointment.date}}`, `{{appointment.time}}`, `{{service.name}}`, `{{staff.name}}` |
| Post-Service Follow-up | X days after completed appointment | `{{client.name}}`, `{{service.name}}`, `{{appointment.date}}` |
| Return Reminder | X days since last visit | `{{client.name}}`, `{{last_visit_date}}`, `{{days_since}}` |
| Reactivation | X days since last visit (longer) | `{{client.name}}`, `{{last_visit_date}}` |
| Related Service Suggestion | After specific service completion | `{{client.name}}`, `{{completed_service}}`, `{{suggested_service}}` |

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 2 | Marketing | `/marketing` | `Megaphone` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/marketing` | authenticated | Marketing dashboard |
| `/marketing/templates` | authenticated | Template library |
| `/marketing/templates/new` | authenticated | Create template |
| `/marketing/templates/:id` | authenticated | Edit template |
| `/marketing/automations` | authenticated | Automation rules |
| `/marketing/automations/new` | authenticated | Create automation |
| `/marketing/log` | authenticated | Dispatch log |

### Widget Zones

**Exposes:** (none)

**Injects into:**
- `clients.detail.tabs` → "Messages" tab (message history for this client)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Communication | Default sender, opt-out settings, channel configuration |

## Database Tables

### `message_templates`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | Template name |
| channel | text | `whatsapp`, `email`, `sms`, `push` |
| subject | text | For email |
| body | text NOT NULL | Template body with `{{variables}}` |
| variables | text[] | List of available variables |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `message_events` (automation rules)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | |
| event_type | text NOT NULL | `birthday`, `appointment_reminder`, `post_service`, `return_reminder`, `reactivation`, `related_service` |
| template_id | uuid FK → message_templates | |
| channel | text | Delivery channel |
| trigger_config | jsonb | Event-specific config (hours_before, days_after, etc.) |
| is_active | boolean | |
| created_at | timestamptz | |

### `message_dispatch_log`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| event_id | uuid FK → message_events | Which automation triggered it |
| template_id | uuid FK → message_templates | |
| client_id | uuid FK → clients | |
| channel | text | `whatsapp`, `email`, `sms` |
| recipient | text | Phone/email |
| rendered_body | text | Final message after variable substitution |
| status | text | `pending`, `sent`, `delivered`, `failed`, `read` |
| sent_at | timestamptz | |
| error_message | text | If failed |
| created_at | timestamptz | |

### Edge Functions
- `message-dispatcher` — Core dispatch function that:
  1. Queries due automations (appointments in X hours, birthdays today, etc.)
  2. Enriches template variables from appointment/client/service data
  3. Renders message body with variable substitution
  4. Delegates to channel-specific sender (WhatsApp edge function, email API, etc.)
  5. Logs dispatch result

## Key Workflows

### Creating an Automation
1. Navigate to `/marketing/automations/new`
2. Select event type (e.g., "Appointment Reminder")
3. Configure trigger (e.g., "24 hours before")
4. Select or create message template
5. Choose channel (WhatsApp, email)
6. Activate automation

### Message Dispatch Flow
1. Cron triggers `message-dispatcher` edge function
2. Queries appointments/clients matching active automation rules
3. For each match, renders template with actual data
4. Calls channel-specific sender (e.g., `whatsapp-send` edge function)
5. Logs result in `message_dispatch_log`

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| MarketingDashboard | `src/pages/marketing/MarketingDashboard.tsx` |
| MessageTemplatesList | `src/pages/configuracoes/comunicacao/MessageTemplatesList.tsx` |
| MessageEventsList | `src/pages/configuracoes/comunicacao/MessageEventsList.tsx` |
| MessageDispatchLog | `src/pages/configuracoes/comunicacao/MessageDispatchLog.tsx` |
| CommunicationDashboard | `src/pages/configuracoes/comunicacao/CommunicationDashboard.tsx` |
