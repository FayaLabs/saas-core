import { describe, it, expect } from 'vitest'
import { hasPermission, requireRole, ROLES } from './permissions'

describe('permissions', () => {
  it('owner has all permissions', () => {
    expect(hasPermission('owner', 'manage_billing')).toBe(true)
    expect(hasPermission('owner', 'manage_settings')).toBe(true)
    expect(hasPermission('owner', 'manage_team')).toBe(true)
  })

  it('viewer has only view_content', () => {
    expect(hasPermission('viewer', 'manage_billing')).toBe(false)
    expect(hasPermission('viewer', 'view_content')).toBe(true)
  })

  it('requireRole checks hierarchy', () => {
    expect(requireRole('owner', 'admin')).toBe(true)
    expect(requireRole('viewer', 'admin')).toBe(false)
  })

  it('ROLES are defined', () => {
    expect(ROLES).toEqual(['owner', 'admin', 'manager', 'staff', 'viewer'])
  })
})
