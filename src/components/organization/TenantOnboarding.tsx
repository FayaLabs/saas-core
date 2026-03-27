import * as React from 'react'
import { Building2, ArrowRight, ArrowLeft, Check, Users, Globe, Utensils, Scissors, Heart, Briefcase } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { cn } from '../../lib/cn'
import { useOrgAdapter } from '../../lib/org-context'
import { useAuthStore } from '../../stores/auth.store'
import { useOrganizationStore } from '../../stores/organization.store'
import { usePermissionsStore } from '../../stores/permissions.store'
import type { CreateOrgOptions } from '../../types/org-adapter'

// ---------------------------------------------------------------------------
// Vertical options
// ---------------------------------------------------------------------------

const VERTICALS = [
  {
    id: 'food',
    name: 'Food & Beverage',
    description: 'Restaurants, cafes, bars, food trucks',
    icon: Utensils,
    color: 'text-orange-500 bg-orange-500/10',
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    description: 'Salons, spas, barbershops, studios',
    icon: Scissors,
    color: 'text-pink-500 bg-pink-500/10',
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    description: 'Gyms, clinics, physiotherapy, wellness',
    icon: Heart,
    color: 'text-red-500 bg-red-500/10',
  },
  {
    id: 'services',
    name: 'Professional Services',
    description: 'Consulting, legal, accounting',
    icon: Briefcase,
    color: 'text-blue-500 bg-blue-500/10',
  },
]

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasilia (BRT)' },
  { value: 'America/New_York', label: 'Eastern (US)' },
  { value: 'America/Chicago', label: 'Central (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'UTC', label: 'UTC' },
]

const CURRENCIES = [
  { value: 'BRL', label: 'BRL - Real' },
  { value: 'USD', label: 'USD - Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - Pound' },
]

const TEAM_SIZES = [
  { value: '1', label: 'Just me' },
  { value: '2-5', label: '2-5 people' },
  { value: '6-15', label: '6-15 people' },
  { value: '16-50', label: '16-50 people' },
  { value: '50+', label: '50+ people' },
]

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            i === current
              ? 'w-8 bg-primary'
              : i < current
                ? 'w-2 bg-primary/60'
                : 'w-2 bg-muted-foreground/20'
          )}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wizard steps
// ---------------------------------------------------------------------------

type WizardData = {
  verticalId: string
  companyName: string
  timezone: string
  currency: string
  teamSize: string
}

// Step 1: Select vertical
function VerticalStep({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">What type of business do you run?</h2>
        <p className="text-sm text-muted-foreground">
          We'll customize your workspace with the right tools.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {VERTICALS.map((v) => {
          const Icon = v.icon
          const isSelected = selected === v.id
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all',
                'hover:border-primary/50 hover:bg-accent/50',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border'
              )}
            >
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', v.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Step 2: Company details
function CompanyStep({
  data,
  onChange,
}: {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}) {
  const verticalName = VERTICALS.find((v) => v.id === data.verticalId)?.name ?? ''

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">Tell us about your business</h2>
        <p className="text-sm text-muted-foreground">
          Setting up your {verticalName.toLowerCase()} workspace.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="onb-company" className="text-sm font-medium">
          Business Name
        </label>
        <Input
          id="onb-company"
          value={data.companyName}
          onChange={(e) => onChange({ companyName: e.target.value })}
          placeholder="e.g. Casa do Sabor"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Team Size</label>
        <Select value={data.teamSize} onValueChange={(v) => onChange({ teamSize: v })}>
          <SelectTrigger>
            <SelectValue placeholder="How many people?" />
          </SelectTrigger>
          <SelectContent>
            {TEAM_SIZES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Step 3: Regional preferences
function RegionalStep({
  data,
  onChange,
}: {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">Regional preferences</h2>
        <p className="text-sm text-muted-foreground">
          Set your timezone and currency for reports and scheduling.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Timezone</label>
        <Select value={data.timezone} onValueChange={(v) => onChange({ timezone: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Currency</label>
        <Select value={data.currency} onValueChange={(v) => onChange({ currency: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 3

interface TenantOnboardingProps {
  /** Pre-set vertical — skips niche selection step */
  verticalId?: string
}

export function TenantOnboarding({ verticalId: presetVerticalId }: TenantOnboardingProps = {}) {
  const adapter = useOrgAdapter()
  const user = useAuthStore((s) => s.user)
  const setCurrentOrg = useOrganizationStore((s) => s.setCurrentOrg)
  const setUserOrgs = useOrganizationStore((s) => s.setUserOrgs)
  const setMembers = useOrganizationStore((s) => s.setMembers)
  const setProfiles = usePermissionsStore((s) => s.setProfiles)
  const setCurrentProfile = usePermissionsStore((s) => s.setCurrentProfile)

  const skipVerticalStep = !!presetVerticalId
  const [step, setStep] = React.useState(skipVerticalStep ? 1 : 0)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  const [data, setData] = React.useState<WizardData>({
    verticalId: presetVerticalId ?? '',
    companyName: '',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    teamSize: '1',
  })

  const update = (updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }))
    setError('')
  }

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!data.verticalId
      case 1: return !!data.companyName.trim()
      case 2: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
    } else {
      handleCreate()
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleCreate = async () => {
    if (!user || !data.companyName.trim()) return

    setSaving(true)
    setError('')

    try {
      const options: CreateOrgOptions = {
        verticalId: data.verticalId,
        timezone: data.timezone,
        currency: data.currency,
        teamSize: data.teamSize,
      }

      const org = await adapter.createOrg(data.companyName.trim(), user.id, options)
      setCurrentOrg(org)

      const [orgs, members, profiles] = await Promise.all([
        adapter.listUserOrgs(user.id),
        adapter.listMembers(org.id),
        adapter.listProfiles(org.id),
      ])

      setUserOrgs(orgs)
      setMembers(members)
      setProfiles(profiles)

      const myMembership = members.find((m) => m.userId === user.id)
      if (myMembership) {
        const profile = profiles.find((p) => p.id === myMembership.profileId)
        setCurrentProfile(profile ?? null)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create workspace')
      setSaving(false)
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Set up your workspace</CardTitle>
          <CardDescription>
            {step === 0 && 'A few quick questions to customize your experience.'}
            {step === 1 && 'Step 2 of 3'}
            {step === 2 && 'Almost done!'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <StepIndicator current={step} total={TOTAL_STEPS} />

          {step === 0 && (
            <VerticalStep
              selected={data.verticalId}
              onSelect={(id) => update({ verticalId: id })}
            />
          )}
          {step === 1 && (
            <CompanyStep data={data} onChange={update} />
          )}
          {step === 2 && (
            <RegionalStep data={data} onChange={update} />
          )}

          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0 || saving}
              className={step === 0 ? 'invisible' : ''}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance() || saving}
            >
              {saving
                ? 'Creating...'
                : isLastStep
                  ? 'Create Workspace'
                  : 'Continue'}
              {!saving && (isLastStep
                ? <Check className="ml-2 h-4 w-4" />
                : <ArrowRight className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
