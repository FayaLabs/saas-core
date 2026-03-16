import { useEffect } from 'react'
import { useAuthStore } from '../../stores/auth.store'
import { useOrganizationStore, getPersistedOrgId } from '../../stores/organization.store'
import { usePermissionsStore } from '../../stores/permissions.store'
import { useOrgAdapterOptional } from '../../lib/org-context'

export function OrgInitializer() {
  const adapter = useOrgAdapterOptional()
  const user = useAuthStore((s) => s.user)
  const setCurrentOrg = useOrganizationStore((s) => s.setCurrentOrg)
  const setUserOrgs = useOrganizationStore((s) => s.setUserOrgs)
  const setMembers = useOrganizationStore((s) => s.setMembers)
  const setLoading = useOrganizationStore((s) => s.setLoading)
  const setProfiles = usePermissionsStore((s) => s.setProfiles)
  const setCurrentProfile = usePermissionsStore((s) => s.setCurrentProfile)

  useEffect(() => {
    if (!adapter || !user) return

    let cancelled = false

    async function init() {
      setLoading(true)
      try {
        const orgs = await adapter!.listUserOrgs(user!.id)
        if (cancelled) return
        setUserOrgs(orgs)

        if (orgs.length === 0) return

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
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [adapter, user?.id])

  return null
}
