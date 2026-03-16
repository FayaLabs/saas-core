import type { PermissionProfile } from './permissions'
import type { Invite } from './invite'

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface OrgMember {
  id: string
  userId: string
  orgId: string
  profileId: string
  profileName: string
  user: {
    id: string
    email: string
    fullName: string
    avatarUrl?: string
  }
  joinedAt: string
}

export interface OrgMembership {
  orgId: string
  orgName: string
  orgSlug: string
  orgLogoUrl?: string
  profileId: string
  profileName: string
}

export interface OrgAdapter {
  listUserOrgs(userId: string): Promise<OrgMembership[]>
  getOrg(orgId: string): Promise<Organization>
  createOrg(name: string, userId: string): Promise<Organization>
  updateOrg(orgId: string, data: Partial<Organization>): Promise<Organization>

  listMembers(orgId: string): Promise<OrgMember[]>
  updateMemberProfile(orgId: string, memberId: string, profileId: string): Promise<void>
  removeMember(orgId: string, memberId: string): Promise<void>

  listProfiles(orgId: string): Promise<PermissionProfile[]>
  createProfile(orgId: string, profile: Omit<PermissionProfile, 'id' | 'isSystem'>): Promise<PermissionProfile>
  updateProfile(orgId: string, profileId: string, data: Partial<PermissionProfile>): Promise<PermissionProfile>
  deleteProfile(orgId: string, profileId: string): Promise<void>

  listInvites(orgId: string): Promise<Invite[]>
  createInvite(orgId: string, email: string, profileId: string, invitedBy: string): Promise<Invite>
  bulkInvite(orgId: string, emails: string[], profileId: string, invitedBy: string): Promise<Invite[]>
  revokeInvite(orgId: string, inviteId: string): Promise<void>
  resendInvite(orgId: string, inviteId: string): Promise<Invite>
}
