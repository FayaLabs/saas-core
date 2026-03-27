import * as React from 'react'
import { Building2, ArrowRight, Check, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/cn'
import { useOrgAdapter } from '../../lib/org-context'
import { useAuthStore } from '../../stores/auth.store'
import { useOrganizationStore } from '../../stores/organization.store'
import { usePermissionsStore } from '../../stores/permissions.store'
import type { CreateOrgOptions } from '../../types/org-adapter'

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasilia (BRT)' },
  { value: 'America/New_York', label: 'Eastern (US)' },
  { value: 'America/Chicago', label: 'Central (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'UTC', label: 'UTC' },
]

const CURRENCIES = [
  { value: 'BRL', label: 'BRL - Real' },
  { value: 'USD', label: 'USD - Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - Pound' },
]

interface TenantOnboardingProps {
  verticalId?: string
  appName?: string
  logo?: React.ReactNode
}

export function TenantOnboarding({ verticalId, appName, logo }: TenantOnboardingProps) {
  const adapter = useOrgAdapter()
  const user = useAuthStore((s) => s.user)
  const setCurrentOrg = useOrganizationStore((s) => s.setCurrentOrg)
  const setUserOrgs = useOrganizationStore((s) => s.setUserOrgs)
  const setMembers = useOrganizationStore((s) => s.setMembers)
  const setProfiles = usePermissionsStore((s) => s.setProfiles)
  const setCurrentProfile = usePermissionsStore((s) => s.setCurrentProfile)

  const [step, setStep] = React.useState(0) // 0 = company, 1 = preferences, 2 = creating
  const [error, setError] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  const [timezone, setTimezone] = React.useState('America/Sao_Paulo')
  const [currency, setCurrency] = React.useState('BRL')

  const handleCreate = async () => {
    if (!user || !companyName.trim()) return

    setStep(2) // Show "Creating..." state
    setError('')

    try {
      const options: CreateOrgOptions = {
        verticalId: verticalId ?? undefined,
        timezone,
        currency,
      }

      const org = await adapter.createOrg(companyName.trim(), user.id, options)
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
      setStep(1) // Go back to last form step
    }
  }

  // Creating state — animated loading inside the same frame
  if (step === 2) {
    return (
      <div className="saas-page-enter space-y-6 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Setting up your workspace</h2>
          <p className="text-sm text-muted-foreground mt-1">This will only take a moment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="saas-page-enter space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Set up your workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 0 ? 'What should we call your workspace?' : 'Regional preferences'}
        </p>
      </div>

      {/* Step 0: Company name */}
      {step === 0 && (
        <div className="saas-nav-forward space-y-4">
          <div>
            <label className="text-sm font-medium">Workspace name</label>
            <Input
              value={companyName}
              onChange={(e) => { setCompanyName(e.target.value); setError('') }}
              placeholder="My Company"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && companyName.trim()) setStep(1) }}
            />
          </div>
          <Button className="w-full" onClick={() => setStep(1)} disabled={!companyName.trim()}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 1: Regional preferences */}
      {step === 1 && (
        <div className="saas-nav-forward space-y-4">
          <div>
            <label className="text-sm font-medium">Timezone</label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
            <Button className="flex-1" onClick={handleCreate}>
              Create Workspace <Check className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
