# Plugin: Staff & Professionals
> Team member management with work schedules, professions, and permission rules

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `staff` |
| **Scope** | `cross-niche` |
| **Niche** | — |
| **Default** | yes |
| **Min Plan** | `free` |
| **Dependencies** | — |

## Description

The staff plugin manages operational team members — professionals who deliver services and employees who support operations. This is distinct from saas-core's `org` (tenant membership/auth) — staff handles operational data: work schedules, specialties, professions, and per-staff permission rules.

**Value beyond CRUD:** The list page uses `createCrudPage()`. The custom detail page (`/staff/:id`) has tabs for schedules, permission rules, performance metrics, and a dashboard. Other plugins inject tabs (commissions injects "Commissions" tab, scheduling injects "Appointments" tab).

## CRUD

Uses `createCrudPage(staffEntityDef)` for list + create/edit.

### EntityDef Schema

```ts
const staffEntityDef: EntityDef = {
  name: 'Staff Member',
  namePlural: 'Staff',
  icon: 'UserCog',
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, showInTable: true, searchable: true },
    { key: 'email', label: 'Email', type: 'email', showInTable: true, searchable: true },
    { key: 'phone', label: 'Phone', type: 'phone', showInTable: true },
    { key: 'role', label: 'Role', type: 'select', options: ['professional', 'employee'], showInTable: true },
    { key: 'profession_id', label: 'Profession', type: 'select', showInTable: true },
    { key: 'is_active', label: 'Active', type: 'boolean', defaultValue: true, showInTable: true },
    { key: 'avatar_url', label: 'Avatar', type: 'image' },
    { key: 'birth_date', label: 'Birth Date', type: 'date' },
    { key: 'hire_date', label: 'Hire Date', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  data: {
    table: 'staff_members',
    tenantScoped: true,
    tenantIdColumn: 'company_id',
    searchColumns: ['name', 'email'],
  },
  defaultSort: 'name',
  displayField: 'name',
  imageField: 'avatar_url',
}
```

## Custom Pages

### Staff Detail Page (`/staff/:id`)

Built-in tabs:
| Tab | Description |
|-----|-------------|
| **Overview** | Profile, avatar, profession, contact info |
| **Schedule** | Weekly work schedule with exceptions (holidays, vacations) |
| **Permissions** | Permission rule assignment |
| **Dashboard** | Individual performance metrics |

### Exposed Widget Zone: `staff.detail.tabs`

Other plugins inject tabs:
- `scheduling` → "Appointments" tab (upcoming and past appointments)
- `commissions` → "Commissions" tab (earnings, rules, payouts)
- `financial` → "Revenue" tab (revenue generated)

## Integration Points

### Navigation (Sidebar)
| Section | Position | Label | Route | Icon |
|---------|----------|-------|-------|------|
| main | 3 | Staff | `/staff` | `UserCog` |

### Routes
| Path | Guard | Description |
|------|-------|-------------|
| `/staff` | authenticated | Staff list (createCrudPage) |
| `/staff/new` | authenticated | Create staff form |
| `/staff/:id` | authenticated | Staff detail page (custom) |
| `/staff/:id/edit` | authenticated | Edit staff form |
| `/staff/professions` | authenticated | Profession management |

### Widget Zones

**Exposes:**
- `staff.detail.tabs` — Tab injection on staff detail page

**Injects into:** (none)

### Settings Tabs
| Tab | Description |
|-----|-------------|
| Staff | Default work hours, profession list management, permission defaults |

## Database Tables

### `staff_members`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| user_id | uuid FK → auth.users | Optional link to auth user |
| name | text NOT NULL | |
| email | text | |
| phone | text | |
| role | text NOT NULL | 'professional' or 'employee' |
| profession_id | uuid FK → professions | |
| is_active | boolean | Default true |
| avatar_url | text | |
| birth_date | date | |
| hire_date | date | |
| notes | text | |
| normalized_name | text | For search |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `professions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | e.g., "Hair Stylist", "Chef", "Waiter" |
| created_at | timestamptz | |

### `staff_schedules`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| staff_id | uuid FK → staff_members | |
| day_of_week | int | 0=Sunday...6=Saturday |
| start_time | time | |
| end_time | time | |
| break_start | time | Optional break |
| break_end | time | |
| is_working | boolean | Whether they work this day |

### `staff_schedule_exceptions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| staff_id | uuid FK → staff_members | |
| date | date NOT NULL | Specific date |
| is_available | boolean | Override: available or not |
| start_time | time | Custom hours for this date |
| end_time | time | |
| reason | text | Vacation, sick, holiday, etc. |

### `permission_rules`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| company_id | uuid FK → tenants | |
| name | text NOT NULL | Rule profile name |
| description | text | |
| created_at | timestamptz | |

### `permission_rule_details`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| rule_id | uuid FK → permission_rules | |
| permission | text NOT NULL | System permission ID |
| can_view | boolean | |
| can_insert | boolean | |
| can_edit | boolean | |
| can_delete | boolean | |

### `staff_permission_rules`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| staff_id | uuid FK → staff_members | |
| rule_id | uuid FK → permission_rules | |

### RPC Functions
- `search_professionals_normalized(text, uuid)` — Search staff by normalized name
- `search_employees_normalized(text, uuid)` — Search employees
- `auto_link_professional_user_id()` — Auto-link staff to auth user by email
- `claim_personnel_record(uuid)` — Staff member claims their own record

## Key Workflows

### Staff Onboarding
1. Admin creates staff member via `/staff/new`
2. Sets profession, work schedule
3. Optionally assigns permission rules
4. Staff member can claim their record when they log in (auto-link by email)

### Schedule Management
1. Navigate to staff detail → Schedule tab
2. Set weekly recurring schedule (Mon-Sat with times)
3. Add exceptions for specific dates (vacation, sick days)
4. Scheduling plugin reads this to determine availability

## Beautyplace Source Reference

| Component | Path |
|-----------|------|
| ProfessionalsList | `src/pages/profissionais/ProfessionalsList.tsx` |
| ProfessionalForm | `src/pages/profissionais/components/ProfessionalForm.tsx` |
| ProfessionalDashboard | `src/pages/profissionais/components/ProfessionalDashboard.tsx` |
| EmployeesList | `src/pages/cadastro/funcionarios/EmployeesList.tsx` |
| EmployeePermissionsTab | `src/pages/cadastro/funcionarios/components/EmployeePermissionsTab.tsx` |
| WorkScheduleDialog | `src/components/WorkScheduleDialog.tsx` |
| ManageProfessionsDialog | `src/components/ManageProfessionsDialog.tsx` |
| PermissionRulesView | `src/pages/configuracoes/permissoes/PermissionRulesView.tsx` |
