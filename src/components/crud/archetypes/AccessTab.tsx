import React from 'react'
import { Shield, Check, X, Send, RotateCw, UserX, KeyRound, Lock, Power, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Separator } from '../../ui/separator'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select'
import { InviteMemberDialog } from '../../organization/InviteMemberDialog'
import { useOrganizationStore } from '../../../stores/organization.store'
import { usePermissionsStore } from '../../../stores/permissions.store'
import { useInviteStore } from '../../../stores/invite.store'
import { useOrgAdapterOptional } from '../../../lib/org-context'
import { usePermission } from '../../../hooks/usePermission'
import { useTranslation } from '../../../hooks/useTranslation'
import { toast } from '../../notifications/ToastProvider'
import type { SystemPermission } from '../../../types/permissions'

const SYSTEM_PERMS: { id: SystemPermission; key: string }[] = [
  { id: 'manage_team', key: 'crud.access.manageTeam' },
  { id: 'manage_billing', key: 'crud.access.manageBilling' },
  { id: 'manage_settings', key: 'crud.access.manageSettings' },
  { id: 'manage_permissions', key: 'crud.access.managePermissions' },
]

// ---------------------------------------------------------------------------
// AccessTab — Employee access management
// ---------------------------------------------------------------------------

export function AccessTab({ item }: { item: Record<string, any> }) {
  const { t } = useTranslation()
  const adapter = useOrgAdapterOptional()
  const currentOrg = useOrganizationStore((s) => s.currentOrg)
  const members = useOrganizationStore((s) => s.members)
  const setMembers = useOrganizationStore((s) => s.setMembers)
  const profiles = usePermissionsStore((s) => s.profiles)
  const invites = useInviteStore((s) => s.invites)
  const setInvites = useInviteStore((s) => s.setInvites)
  const { hasSystemPermission } = usePermission()
  const canManage = hasSystemPermission('manage_team')

  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [confirmRevoke, setConfirmRevoke] = React.useState(false)

  // Persist tracked email for persons without email field
  const storageKey = `access-invite:${item.id}`
  const [trackedEmail, setTrackedEmail] = React.useState<string | null>(() => {
    try { return sessionStorage.getItem(storageKey) } catch { return null }
  })
  const trackEmail = (em: string) => {
    setTrackedEmail(em)
    try { sessionStorage.setItem(storageKey, em) } catch { /* */ }
  }

  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (adapter && currentOrg) {
      setLoading(true)
      adapter.listInvites(currentOrg.id).then(setInvites).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [adapter, currentOrg?.id])

  // ── Matching ──
  const email = (item.email as string | undefined) || trackedEmail || undefined
  const member = email ? members.find((m) => m.user?.email === email) : undefined
  const invite = email ? invites.find((i) => i.email === email && (i.status === 'pending' || i.status === 'accepted')) : undefined
  const isLinked = !!member
  const isPending = !member && invite?.status === 'pending'
  const hasAccess = isLinked || isPending

  const profileId = member?.profileId ?? invite?.profileId ?? invite?.role
  const effectiveProfile = profileId ? profiles.find((p) => p.id === profileId) : undefined

  // ── Handlers ──
  const handleChangeProfile = async (newProfileId: string) => {
    if (!adapter || !currentOrg) return
    if (member) {
      try {
        await adapter.updateMemberProfile(currentOrg.id, member.id, newProfileId)
        setMembers(await adapter.listMembers(currentOrg.id))
        toast.success(t('crud.access.profileUpdated'))
      } catch { toast.error(t('common.error')) }
    }
  }

  const handleResend = async () => {
    if (!adapter || !currentOrg || !invite) return
    try {
      await adapter.resendInvite(currentOrg.id, invite.id)
      setInvites(await adapter.listInvites(currentOrg.id))
      toast.success(t('crud.access.inviteResent'))
    } catch { toast.error(t('common.error')) }
  }

  const handleRevokeInvite = async () => {
    if (!adapter || !currentOrg || !invite) return
    try {
      await adapter.revokeInvite(currentOrg.id, invite.id)
      setInvites(await adapter.listInvites(currentOrg.id))
      setConfirmRevoke(false)
      toast.success(t('crud.access.inviteRevoked'))
    } catch { toast.error(t('common.error')) }
  }

  const handleRemoveMember = async () => {
    if (!adapter || !currentOrg || !member) return
    try {
      await adapter.removeMember(currentOrg.id, member.id)
      setMembers(await adapter.listMembers(currentOrg.id))
      setConfirmRevoke(false)
      toast.success(t('crud.access.accessRemoved'))
    } catch { toast.error(t('common.error')) }
  }

  const handleResetPassword = async () => {
    if (!adapter || !email) return
    try {
      if ((adapter as any).resetPassword) {
        await (adapter as any).resetPassword(email)
      }
      toast.success(t('crud.access.passwordResetSent'))
    } catch { toast.error(t('common.error')) }
  }

  const prevCount = React.useRef(invites.length)
  const handleInviteClose = (open: boolean) => {
    if (open) prevCount.current = invites.length
    setInviteOpen(open)
    if (!open && adapter && currentOrg) {
      adapter.listInvites(currentOrg.id).then((fresh) => {
        setInvites(fresh)
        if (fresh.length > prevCount.current) {
          const newest = fresh.filter((i) => i.status === 'pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
          if (newest) trackEmail(newest.email)
        }
      }).catch(() => {})
      adapter.listMembers(currentOrg.id).then(setMembers).catch(() => {})
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
              <div className="h-8 w-28 rounded-md bg-muted" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="h-5 w-36 rounded bg-muted" />
            <div className="h-3 w-56 rounded bg-muted mt-1" />
          </CardHeader>
          <CardContent>
            <div className="h-9 w-64 rounded-md bg-muted" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="h-9 rounded-md bg-muted" />
              <div className="h-9 rounded-md bg-muted" />
              <div className="h-9 rounded-md bg-muted" />
              <div className="h-9 rounded-md bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── No access state ──
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">{t('crud.access.noAccount')}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{t('crud.access.noAccountDesc')}</p>
            {canManage && (
              <Button className="mt-4" onClick={() => setInviteOpen(true)}>
                <KeyRound className="h-4 w-4 mr-2" />
                {t('crud.access.grantAccess')}
              </Button>
            )}
          </CardContent>
        </Card>
        <InviteMemberDialog open={inviteOpen} onOpenChange={handleInviteClose} defaultEmail={item.email || undefined} />
      </div>
    )
  }

  // ── Has access (linked or pending) ──
  return (
    <div className="space-y-6">
      {/* ═══ Section 1: Account ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('crud.access.account')}</CardTitle>
          <CardDescription>{t('crud.access.accountDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status row */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isLinked ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/20'}`}>
                {isLinked ? <Check className="h-4 w-4 text-emerald-600" /> : <Send className="h-4 w-4 text-amber-600" />}
              </div>
              <div>
                <p className="text-sm font-medium">{email}</p>
                <p className="text-xs text-muted-foreground">
                  {isLinked && member
                    ? t('crud.access.joined', { date: new Date(member.joinedAt).toLocaleDateString() })
                    : t('crud.access.inviteSent', { date: new Date(invite!.createdAt).toLocaleDateString() })
                  }
                </p>
              </div>
            </div>
            <Badge variant="secondary" className={`text-[10px] border-0 ${
              isLinked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
            }`}>
              {isLinked ? t('crud.access.statusLinked') : t('crud.access.statusPending')}
            </Badge>
          </div>

          {/* Pending invite actions */}
          {isPending && canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResend}>
                <RotateCw className="h-3.5 w-3.5 mr-1.5" />{t('organization.resend')}
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={handleRevokeInvite}>
                <UserX className="h-3.5 w-3.5 mr-1.5" />{t('organization.revoke')}
              </Button>
            </div>
          )}

          {/* Linked account actions */}
          {isLinked && canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetPassword}>
                <Lock className="h-3.5 w-3.5 mr-1.5" />{t('crud.access.resetPassword')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Section 2: Role & Permissions ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('crud.access.permissionProfile')}</CardTitle>
          <CardDescription>{t('crud.access.profileDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Profile selector */}
          {canManage ? (
            <Select value={profileId ?? ''} onValueChange={handleChangeProfile}>
              <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div>
                      <span className="font-medium">{p.name}</span>
                      {p.description && <span className="text-muted-foreground ml-2 text-xs">— {p.description}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary" className="text-sm">{effectiveProfile?.name ?? '—'}</Badge>
          )}

          {/* System permissions */}
          {effectiveProfile && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('crud.access.systemAccess')}</p>
              <div className="grid grid-cols-2 gap-2">
                {SYSTEM_PERMS.map((sp) => {
                  const has = effectiveProfile.systemPermissions.includes(sp.id)
                  return (
                    <div key={sp.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                      {has ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/40" />}
                      <span className={`text-xs ${has ? 'text-foreground' : 'text-muted-foreground'}`}>{t(sp.key)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Section 3: Danger Zone ═══ */}
      {canManage && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">{t('crud.access.dangerZone')}</CardTitle>
            <CardDescription>{t('crud.access.dangerZoneDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!confirmRevoke ? (
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setConfirmRevoke(true)}>
                <Power className="h-3.5 w-3.5 mr-1.5" />
                {isLinked ? t('crud.access.removeAccess') : t('crud.access.revokeInvite')}
              </Button>
            ) : (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">{t('crud.access.confirmRemoveTitle')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('crud.access.confirmRemoveDesc')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="destructive" size="sm" onClick={isLinked ? handleRemoveMember : handleRevokeInvite}>
                    {isLinked ? t('crud.access.removeAccess') : t('crud.access.revokeInvite')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmRevoke(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={handleInviteClose} defaultEmail={item.email || undefined} />
    </div>
  )
}
