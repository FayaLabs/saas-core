import * as React from 'react'
import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LogOut, User, Settings, CreditCard, HelpCircle, Keyboard, Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../stores/theme.store'

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
          <Avatar.Root className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            {user.avatarUrl && (
              <Avatar.Image
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            )}
            <Avatar.Fallback className="flex h-full w-full items-center justify-center text-[10px] font-medium">
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
              Profile
            </DropdownMenu.Item>
          )}
          {onSettings && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted"
              onSelect={onSettings}
            >
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenu.Item>
          )}
          {onBilling && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted"
              onSelect={onBilling}
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted">
            <HelpCircle className="h-4 w-4" />
            Help
          </DropdownMenu.Item>
          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted">
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
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

          {/* Theme Toggle */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted data-[state=open]:bg-muted">
              {mode === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : mode === 'light' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
              Theme
              <span className="ml-auto text-xs text-muted-foreground capitalize">{mode}</span>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                sideOffset={4}
                className="z-50 min-w-[140px] rounded-md border border-border bg-card p-1 shadow-md"
              >
                <DropdownMenu.Item
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted',
                    mode === 'light' && 'text-primary'
                  )}
                  onSelect={() => setMode('light')}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted',
                    mode === 'dark' && 'text-primary'
                  )}
                  onSelect={() => setMode('dark')}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted',
                    mode === 'system' && 'text-primary'
                  )}
                  onSelect={() => setMode('system')}
                >
                  <Monitor className="h-4 w-4" />
                  System
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {/* Sign Out */}
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
            onSelect={onSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
