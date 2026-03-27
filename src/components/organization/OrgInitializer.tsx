import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth.store'
import { useOrganizationStore, getPersistedOrgId } from '../../stores/organization.store'
import { usePermissionsStore } from '../../stores/permissions.store'
import { useOrgAdapterOptional } from '../../lib/org-context'
import { TenantOnboarding } from './TenantOnboarding'

export function OrgInitializer({ verticalId }: { verticalId?: string } = {}) {
  const adapter = useOrgAdapterOptional()
  const user = useAuthStore((s) => s.user)
  const currentOrg = useOrganizationStore((s) => s.currentOrg)
  const setCurrentOrg = useOrganizationStore((s) => s.setCurrentOrg)
  const setUserOrgs = useOrganizationStore((s) => s.setUserOrgs)
  const setMembers = useOrganizationStore((s) => s.setMembers)
  const setLoading = useOrganizationStore((s) => s.setLoading)
  const setProfiles = usePermissionsStore((s) => s.setProfiles)
  const setCurrentProfile = usePermissionsStore((s) => s.setCurrentProfile)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!adapter || !user) return

    let cancelled = false

    async function init() {
      setLoading(true)
      try {
        const orgs = await adapter!.listUserOrgs(user!.id)
        if (cancelled) return
        setUserOrgs(orgs)

        if (orgs.length === 0) {
          setNeedsOnboarding(true)
          setInitialized(true)
          return
        }

        setNeedsOnboarding(false)

        // Select persisted org or first
        const persistedId = getPersistedOrgId()
        const targetOrg = orgs.find((o) => o.orgId === persistedId) ?? orgs[0]

        const org = await adapter!.getOrg(targetOrg.orgId)
        if (cancelled) return
        setCurrentOrg(org)

        const [members, profiles] = await Promise.all([
          adapter!.listMembers(org.id),
          adapter!.listProfiles(org.id),
        ])
        if (cancelled) return

        setMembers(members)
        setProfiles(profiles)

        // Resolve current user's profile
        const myMembership = members.find((m) => m.userId === user!.id)
        if (myMembership) {
          const profile = profiles.find((p) => p.id === myMembership.profileId)
          setCurrentProfile(profile ?? null)
        }
      } catch {
        // ignore init errors
      } finally {
        if (!cancelled) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [adapter, user?.id])

  // Hide onboarding once org is set (after TenantOnboarding creates one)
  useEffect(() => {
    if (currentOrg && needsOnboarding) {
      setNeedsOnboarding(false)
    }
  }, [currentOrg])

  if (!initialized || !user) return null
  if (needsOnboarding) return <TenantOnboarding verticalId={verticalId} />

  return null
}
