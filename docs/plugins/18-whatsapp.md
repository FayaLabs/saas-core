# Plugin: WhatsApp Integration
> Twilio-powered WhatsApp messaging, bot, templates, and two-way conversations

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `whatsapp` |
| **Scope** | `addon` |
| **Niche** | — |
| **Default** | no |
| **Min Plan** | `starter` |
| **Dependencies** | `clients` |

## Description

The WhatsApp plugin provides full Twilio-powered WhatsApp integration: message template management, two-way messaging, inbound webhook processing, audio transcription (OpenAI Whisper), and a floating chat widget. It serves as the delivery channel for the `marketing` plugin's automated messages and also provides standalone conversation capabilities.

**Value beyond CRUD:** This is an integration plugin with edge functions, webhooks, and real-time message processing. Provides a floating chat FAB for quick messaging, template management with Twilio sync, and inbound message handling with AI processing.

## Custom Pages

### WhatsApp Dashboard (`/whatsapp`)

| View | Route | Description |
|------|-------|-------------|
| Conversations | `/whatsapp` | Conversation list with clients |
| Conversation Detail | `/whatsapp/:clientId` | Message thread with a client |
| Templates | `/whatsapp/templates` | WhatsApp template management |

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| secondary | 7 | WhatsApp | `/whatsapp` | `MessageCircle` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/whatsapp` | authenticated | Conversation list |
| `/whatsapp/:clientId` | authenticated | Conversation thread |
| `/whatsapp/templates` | authenticated | Template management |

### Widget Zones

**Injects into:**
- `shell.floating` → WhatsApp chat FAB (bottom-right)
- `clients.detail.tabs` → "WhatsApp" tab (conversation history)
- `scheduling.appointment.sidebar` → Send confirmation via WhatsApp button

### Settings Tabs
| Tab | Description |
|-----|-------------|
| WhatsApp | Twilio credentials (Account SID, Auth Token, Phone Number), sandbox mode toggle, webhook URL |

## Database Tables

### `whatsapp_config`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| twilio_account_sid | text | Encrypted |
| twilio_auth_token | text | Encrypted |
| twilio_phone_number | text | |
| webhook_url | text | Auto-generated |
| is_sandbox | boolean | Sandbox mode for testing |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `whatsapp_templates`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | Template name |
| body | text NOT NULL | Template body with `{{variables}}` |
| twilio_sid | text | Synced Twilio template SID |
| status | text | `pending`, `approved`, `rejected` |
| language | text | Default 'pt_BR' |
| category | text | `marketing`, `utility`, `authentication` |
| created_at | timestamptz | |

### `whatsapp_messages`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| client_id | uuid FK → clients | |
| direction | text NOT NULL | `inbound`, `outbound` |
| from_number | text | |
| to_number | text | |
| body | text | Message text |
| media_url | text | Image/audio/document URL |
| media_type | text | `image`, `audio`, `document` |
| twilio_sid | text | Twilio message SID |
| status | text | `queued`, `sent`, `delivered`, `read`, `failed` |
| transcription | text | Audio transcription (Whisper) |
| created_at | timestamptz | |

## Edge Functions

### `whatsapp-webhook`
Receives inbound WhatsApp messages from Twilio:
1. Validates Twilio signature
2. Parses message (text, audio, image)
3. If audio → calls `transcribe-audio` for Whisper transcription
4. Looks up client by phone number
5. Stores message in `whatsapp_messages`
6. Optionally triggers `whatsapp-ai-processor` for bot responses

### `whatsapp-send`
Sends outbound WhatsApp messages via Twilio:
1. Accepts recipient, template/body, media
2. Substitutes template variables
3. Calls Twilio API
4. Stores sent message in `whatsapp_messages`
5. Returns Twilio SID for tracking

### `transcribe-audio`
Transcribes audio messages using OpenAI Whisper:
1. Downloads audio from Twilio media URL
2. Sends to OpenAI Whisper API
3. Returns transcription text

### `whatsapp-ai-processor`
AI processing for inbound messages:
1. Analyzes message intent
2. Can handle appointment lookups, confirmations
3. Generates appropriate response
4. Sends via `whatsapp-send`

## Key Workflows

### Appointment Confirmation via WhatsApp
1. Marketing plugin triggers "Appointment Reminder" automation
2. Marketing calls `whatsapp-send` edge function
3. Message sent with appointment details
4. Client replies "confirm" or "cancel"
5. Webhook receives reply → `whatsapp-ai-processor` handles it
6. Appointment status updated accordingly

### Two-Way Chat
1. Staff opens WhatsApp → Conversations
2. Selects client or starts new conversation
3. Sends message via `whatsapp-send`
4. Client replies → webhook receives → displayed in real-time

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| WhatsAppConfig | `src/pages/configuracoes/comunicacao/WhatsAppConfig.tsx` |
| Edge: whatsapp-webhook | `supabase/functions/whatsapp-webhook/index.ts` |
| Edge: whatsapp-send | `supabase/functions/whatsapp-send/index.ts` |
| Edge: whatsapp-ai-processor | `supabase/functions/whatsapp-ai-processor/index.ts` |
| Edge: transcribe-audio | `supabase/functions/transcribe-audio/index.ts` |
| Edge: message-dispatcher | `supabase/functions/message-dispatcher/index.ts` |
