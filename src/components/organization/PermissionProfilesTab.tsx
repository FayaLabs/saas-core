import * as React from 'react'
import { Shield, Pencil, Trash2, Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { PermissionMatrixEditor } from './PermissionMatrixEditor'
import { usePermissionsStore } from '../../stores/permissions.store'
import { useOrganizationStore } from '../../stores/organization.store'
import { useOrgAdapterOptional } from '../../lib/org-context'
import type { PermissionProfile, PermissionAction, SystemPermission } from '../../types/permissions'

export function PermissionProfilesTab() {
  const adapter = useOrgAdapterOptional()
  const currentOrg = useOrganizationStore((s) => s.currentOrg)
  const profiles = usePermissionsStore((s) => s.profiles)
  const features = usePermissionsStore((s) => s.features)
  const setProfiles = usePermissionsStore((s) => s.setProfiles)
  const members = useOrganizationStore((s) => s.members)

  const [editingProfile, setEditingProfile] = React.useState<PermissionProfile | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const memberCountByProfile = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of members) {
      counts[m.profileId] = (counts[m.profileId] ?? 0) + 1
    }
    return counts
  }, [members])

  const handleSave = async (data: { name: string; description?: string; systemPermissions: SystemPermission[]; grants: Record<string, PermissionAction[]> }) => {
    if (!adapter || !currentOrg) return
    setSaving(true)
    try {
      if (editingProfile) {
        await adapter.updateProfile(currentOrg.id, editingProfile.id, data)
      } else {
        await adapter.createProfile(currentOrg.id, data)
      }
      const updated = await adapter.listProfiles(currentOrg.id)
      setProfiles(updated)
      setEditingProfile(null)
      setCreating(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (profile: PermissionProfile) => {
    if (!adapter || !currentOrg || profile.isSystem) return
    try {
      await adapter.deleteProfile(currentOrg.id, profile.id)
      const updated = await adapter.listProfiles(currentOrg.id)
      setProfiles(updated)
    } catch {
      // ignore
    }
  }

  if (creating || editingProfile) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {editingProfile ? `Edit: ${editingProfile.name}` : 'Create Custom Profile'}
        </h3>
        <PermissionMatrixEditor
          features={features}
          profile={editingProfile ?? undefined}
          onSave={handleSave}
          onCancel={() => { setEditingProfile(null); setCreating(false) }}
          saving={saving}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Permission Profiles</h3>
          <p className="text-sm text-muted-foreground">Manage roles and their permissions.</p>
        </div>
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Profile
        </Button>
      </div>

      <div className="grid gap-3">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">{profile.name}</CardTitle>
                  {profile.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                </div>
                {profile.description && (
                  <CardDescription className="text-xs mt-0.5">{profile.description}</CardDescription>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {memberCountByProfile[profile.id] ?? 0} member{(memberCountByProfile[profile.id] ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingProfile(profile)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={profile.isSystem}
                  onClick={() => handleDelete(profile)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
