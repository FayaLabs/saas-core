export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export interface Invite {
  id: string
  orgId: string
  email: string
  profileId: string
  profileName: string
  invitedBy: string
  invitedByName: string
  status: InviteStatus
  createdAt: string
  expiresAt: string
  acceptedAt?: string
}
