import * as React from 'react'
import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LogOut, User, Settings, CreditCard, HelpCircle, Moon, Sun, Globe } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../stores/theme.store'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocaleStore } from '../../stores/locale.store'
import { useI18nConfig } from '../../lib/i18n'

interface UserMenuUser {
  fullName: string
  avatarUrl?: string
  email: string
}

interface UserMenuProps {
  user: UserMenuUser
  onSignOut?: () => void
  onProfile?: () => void
  onSettings?: () => void
  onBilling?: () => void
  extraItems?: { label: string; icon?: React.ReactNode; onClick: () => void }[]
  className?: string
  /** When true, shows only avatar (used in collapsed sidebar) */
  collapsed?: boolean
  /** Which side the dropdown opens on (default: bottom) */
  side?: 'bottom' | 'right' | 'top' | 'left'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserMenu({
  user,
  onSignOut,
  onProfile,
  onSettings,
  onBilling,
  extraItems,
  className,
  collapsed,
  side,
}: UserMenuProps) {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const { t } = useTranslation()
  const { locale, setLocale } = useLocaleStore()
  const i18nConfig = useI18nConfig()

  const LOCALE_LABELS: Record<string, string> = {
    en: 'English',
    'pt-BR': 'Português (BR)',
  }

  const nextLocale = () => {
    const supported = i18nConfig.supported.length > 1 ? i18nConfig.supported : ['en', 'pt-BR']
    const idx = supported.indexOf(locale)
    return supported[(idx + 1) % supported.length]
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-md p-1.5 hover:bg-sidebar-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
          )}
          aria-label="User menu"
        >
          <Avatar.Root className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-accent border border-sidebar-border/30">
            {user.avatarUrl && (
              <Avatar.Image
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            )}
            <Avatar.Fallback className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-sidebar-accent-foreground">
              {getInitials(user.fullName)}
            </Avatar.Fallback>
          </Avatar.Root>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side={side}
          align={side === 'right' ? 'start' : 'end'}
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-md border border-border bg-card p-1 shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {/* User info header */}
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {/* Profile & Help */}
          {onProfile && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted"
              onSelect={onProfile}
            >
              <User className="h-4 w-4" />
              {t('layout.userMenu.profile')}
            </DropdownMenu.Item>
          )}
          {onSettings && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted"
              onSelect={onSettings}
            >
              <Settings className="h-4 w-4" />
              {t('layout.userMenu.settings')}
            </DropdownMenu.Item>
          )}
          {onBilling && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted"
              onSelect={onBilling}
            >
              <CreditCard className="h-4 w-4" />
              {t('layout.userMenu.billing')}
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted">
            <HelpCircle className="h-4 w-4" />
            {t('layout.userMenu.help')}
          </DropdownMenu.Item>
          {/* Extra items from vertical */}
          {extraItems && extraItems.length > 0 && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              {extraItems.map((item) => (
                <DropdownMenu.Item
                  key={item.label}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted"
                  onSelect={item.onClick}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenu.Item>
              ))}
            </>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {/* Theme Toggle — simple light/dark switch */}
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted"
            onSelect={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          >
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {mode === 'dark' ? t('layout.userMenu.lightMode') : t('layout.userMenu.darkMode')}
          </DropdownMenu.Item>

          {/* Language Toggle */}
          <DropdownMenu.Item
            className="flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted"
            onSelect={() => setLocale(nextLocale())}
          >
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {LOCALE_LABELS[locale] ?? locale}
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {/* Sign Out */}
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
            onSelect={onSignOut}
          >
            <LogOut className="h-4 w-4" />
            {t('layout.userMenu.signOut')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
