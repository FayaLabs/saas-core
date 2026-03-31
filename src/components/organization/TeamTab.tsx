import * as React from 'react'
import { UserPlus, MoreHorizontal, Mail, Clock } from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '../ui/dropdown'
import { InviteMemberDialog } from './InviteMemberDialog'
import { useOrganizationStore } from '../../stores/organization.store'
import { usePermissionsStore } from '../../stores/permissions.store'
import { useInviteStore } from '../../stores/invite.store'
import { useOrgAdapterOptional } from '../../lib/org-context'
import { useAuthStore } from '../../stores/auth.store'
import { usePermission } from '../../hooks/usePermission'
import { dedup } from '../../lib/dedup'

export function TeamTab() {
  const adapter = useOrgAdapterOptional()
  const currentOrg = useOrganizationStore((s) => s.currentOrg)
  const members = useOrganizationStore((s) => s.members)
  const setMembers = useOrganizationStore((s) => s.setMembers)
  const profiles = usePermissionsStore((s) => s.profiles)
  const invites = useInviteStore((s) => s.invites)
  const setInvites = useInviteStore((s) => s.setInvites)
  const user = useAuthStore((s) => s.user)
  const { hasSystemPermission } = usePermission()

  const [inviteOpen, setInviteOpen] = React.useState(false)

  // Load invites on mount (deduped to avoid strict mode double-fetch)
  React.useEffect(() => {
    if (adapter && currentOrg) {
      dedup('team:invites:' + currentOrg.id, () => adapter.listInvites(currentOrg.id)).then(setInvites).catch(() => {})
    }
  }, [adapter, currentOrg?.id])

  const handleChangeProfile = async (memberId: string, profileId: string) => {
    if (!adapter || !currentOrg) return
    try {
      await adapter.updateMemberProfile(currentOrg.id, memberId, profileId)
      const updated = await adapter.listMembers(currentOrg.id)
      setMembers(updated)
    } catch {
      // ignore
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!adapter || !currentOrg) return
    try {
      await adapter.removeMember(currentOrg.id, memberId)
      const updated = await adapter.listMembers(currentOrg.id)
      setMembers(updated)
    } catch {
      // ignore
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!adapter || !currentOrg) return
    try {
      await adapter.revokeInvite(currentOrg.id, inviteId)
      const updated = await adapter.listInvites(currentOrg.id)
      setInvites(updated)
    } catch {
      // ignore
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    if (!adapter || !currentOrg) return
    try {
      await adapter.resendInvite(currentOrg.id, inviteId)
      const updated = await adapter.listInvites(currentOrg.id)
      setInvites(updated)
    } catch {
      // ignore
    }
  }

  const canManageTeam = hasSystemPermission('manage_team')
  const pendingInvites = invites.filter((i) => i.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Members</h3>
            <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''} in this organization.</p>
          </div>
          {canManageTeam && (
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Member</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Joined</th>
                  {canManageTeam && (
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground w-12" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map((member) => {
                  const initials = member.user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  const isCurrentUser = member.userId === user?.id

                  return (
                    <tr key={member.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {member.user.avatarUrl && <AvatarImage src={member.user.avatarUrl} />}
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.user.fullName}
                              {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {canManageTeam && !isCurrentUser ? (
                          <Select
                            value={member.profileId}
                            onValueChange={(val) => handleChangeProfile(member.id, val)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{member.profileName}</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>
                      {canManageTeam && (
                        <td className="p-3 text-right">
                          {!isCurrentUser && (
                            <Dropdown>
                              <DropdownTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownContent align="end">
                                <DropdownItem
                                  className="text-destructive"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  Remove member
                                </DropdownItem>
                              </DropdownContent>
                            </Dropdown>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Pending Invites</h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{invite.email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{invite.profileName}</Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Sent {new Date(invite.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {canManageTeam && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleResendInvite(invite.id)}>
                        Resend
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleRevokeInvite(invite.id)}>
                        Revoke
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
