import * as React from 'react'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Checkbox, type CheckboxColor } from '../ui/checkbox'
import type { FeatureDeclaration, PermissionAction, PermissionProfile, SystemPermission } from '../../types/permissions'

const ACTIONS: PermissionAction[] = ['read', 'create', 'edit', 'delete']
const ACTION_COLORS: Record<PermissionAction, CheckboxColor> = {
  read: 'primary',
  create: 'success',
  edit: 'warning',
  delete: 'destructive',
}
const SYSTEM_PERMISSIONS: { id: SystemPermission; label: string }[] = [
  { id: 'manage_team', label: 'Manage Team' },
  { id: 'manage_billing', label: 'Manage Billing' },
  { id: 'manage_settings', label: 'Manage Settings' },
  { id: 'manage_permissions', label: 'Manage Permissions' },
]

interface PermissionMatrixEditorProps {
  features: FeatureDeclaration[]
  profile?: PermissionProfile
  onSave: (data: { name: string; description?: string; systemPermissions: SystemPermission[]; grants: Record<string, PermissionAction[]> }) => void
  onCancel: () => void
  saving?: boolean
}

export function PermissionMatrixEditor({ features, profile, onSave, onCancel, saving }: PermissionMatrixEditorProps) {
  const [name, setName] = React.useState(profile?.name ?? '')
  const [description, setDescription] = React.useState(profile?.description ?? '')
  const [systemPerms, setSystemPerms] = React.useState<SystemPermission[]>(profile?.systemPermissions ?? [])
  const [grants, setGrants] = React.useState<Record<string, PermissionAction[]>>(profile?.grants ?? {})

  const toggleSystemPerm = (perm: SystemPermission) => {
    setSystemPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const toggleGrant = (featureId: string, action: PermissionAction) => {
    setGrants((prev) => {
      const current = prev[featureId] ?? []
      const next = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action]
      return { ...prev, [featureId]: next }
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim() || undefined, systemPermissions: systemPerms, grants })
  }

  // Group features
  const groups = React.useMemo(() => {
    const map = new Map<string, FeatureDeclaration[]>()
    for (const f of features) {
      const group = f.group ?? 'General'
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(f)
    }
    return map
  }, [features])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Profile Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Custom Role" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="mt-1" />
        </div>
      </div>

      {/* System Permissions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">System Permissions</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {SYSTEM_PERMISSIONS.map((sp) => (
            <label key={sp.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
              <Checkbox
                checked={systemPerms.includes(sp.id)}
                onChange={() => toggleSystemPerm(sp.id)}
              />
              {sp.label}
            </label>
          ))}
        </div>
      </Card>

      {/* Feature Permission Matrix */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Feature</th>
                {ACTIONS.map((action) => (
                  <th key={action} className="p-3 text-center text-sm font-medium text-muted-foreground capitalize w-20">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from(groups.entries()).map(([groupName, groupFeatures]) => (
                <React.Fragment key={groupName}>
                  <tr>
                    <td colSpan={5} className="p-2 px-3">
                      <Badge variant="secondary" className="text-xs">{groupName}</Badge>
                    </td>
                  </tr>
                  {groupFeatures.map((feature) => (
                    <tr key={feature.id} className="hover:bg-muted/30">
                      <td className="p-3 text-sm font-medium">{feature.label}</td>
                      {ACTIONS.map((action) => (
                        <td key={action} className="p-3 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={grants[feature.id]?.includes(action) ?? false}
                              onChange={() => toggleGrant(feature.id, action)}
                              color={ACTION_COLORS[action]}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={!name.trim() || saving}>
          {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
        </Button>
      </div>
    </div>
  )
}
