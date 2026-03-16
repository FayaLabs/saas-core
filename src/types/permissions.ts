export type PermissionAction = 'read' | 'create' | 'edit' | 'delete'

export type SystemPermission =
  | 'manage_team'
  | 'manage_billing'
  | 'manage_settings'
  | 'manage_permissions'

export interface FeatureDeclaration {
  id: string
  label: string
  group?: string
}

export interface PermissionProfile {
  id: string
  name: string
  description?: string
  isSystem: boolean
  systemPermissions: SystemPermission[]
  grants: Record<string, PermissionAction[]>
}

export interface PermissionsConfig {
  features: FeatureDeclaration[]
  defaultProfiles: PermissionProfile[]
}
