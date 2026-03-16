import * as React from 'react'
import { useEffect } from 'react'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Home,
  Users,
  Settings,
  CreditCard,
  Bell,
  Calendar,
  Package,
  BarChart3,
  FileText,
  Mail,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'

interface CommandItem {
  id: string
  label: string
  icon?: string
  action: () => void
  group?: string
}

interface CommandPaletteProps {
  commands?: CommandItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Users,
  Settings,
  CreditCard,
  Bell,
  Calendar,
  Package,
  BarChart3,
  FileText,
  Mail,
  Search,
}

export function CommandPalette({
  commands = [],
  open,
  onOpenChange,
}: CommandPaletteProps) {
  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  // Group commands
  const grouped = commands.reduce<Record<string, CommandItem[]>>(
    (acc, cmd) => {
      const group = cmd.group ?? 'Actions'
      if (!acc[group]) acc[group] = []
      acc[group].push(cmd)
      return acc
    },
    {}
  )

  const groupNames = Object.keys(grouped)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2',
            'rounded-xl border border-border bg-popover shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
            'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search for commands and actions
          </Dialog.Description>

          <Command className="flex flex-col" label="Command palette">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                placeholder="Type a command or search..."
                className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              {groupNames.map((group) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {grouped[group].map((cmd) => {
                    const Icon = cmd.icon ? (ICON_MAP[cmd.icon] ?? null) : null

                    return (
                      <Command.Item
                        key={cmd.id}
                        value={cmd.label}
                        onSelect={() => {
                          cmd.action()
                          onOpenChange(false)
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                      >
                        {Icon && (
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span>{cmd.label}</span>
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              ))}
            </Command.List>

            <div className="flex items-center justify-between border-t border-border px-4 py-2">
              <span className="text-xs text-muted-foreground">
                {commands.length} command{commands.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium">
                  &uarr;&darr;
                </kbd>
                <span>navigate</span>
                <kbd className="ml-1 rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium">
                  &crarr;
                </kbd>
                <span>select</span>
              </div>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
