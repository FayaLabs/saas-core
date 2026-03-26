import * as React from 'react'
import { useEffect } from 'react'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Home, Users, Settings, CreditCard, Bell, Calendar, Package, BarChart3,
  FileText, Mail, Search, DollarSign, Megaphone, ShoppingCart, Target,
  Wrench, ClipboardList, Briefcase, UserCog, BookOpen, MessageCircle,
  Globe, Percent, Tag, Camera, UtensilsCrossed, MapPin, Handshake,
  Contact, Building2, Filter, Plus, List,
  type LucideIcon,
} from 'lucide-react'

export interface CommandItem {
  id: string
  label: string
  icon?: string
  action: () => void
  group?: string
  keywords?: string
}

interface CommandPaletteProps {
  commands?: CommandItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Users, Settings, CreditCard, Bell, Calendar, Package, BarChart3,
  FileText, Mail, Search, DollarSign, Megaphone, ShoppingCart, Target,
  Wrench, ClipboardList, Briefcase, UserCog, BookOpen, MessageCircle,
  Globe, Percent, Tag, Camera, UtensilsCrossed, MapPin, Handshake,
  Contact, Building2, Filter, Plus, List,
}

export function CommandPalette({ commands = [], open, onOpenChange }: CommandPaletteProps) {
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

  const grouped = commands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    const group = cmd.group ?? 'Actions'
    if (!acc[group]) acc[group] = []
    acc[group].push(cmd)
    return acc
  }, {})

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="saas-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="saas-cmd-palette fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border/50 bg-popover shadow-2xl">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Search for pages and actions</Dialog.Description>

          <Command className="flex flex-col" label="Command palette">
            <div className="flex items-center gap-3 border-b border-border/50 px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                placeholder="Search pages, actions..."
                className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <kbd className="hidden shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">ESC</kbd>
            </div>

            <Command.List className="max-h-[320px] overflow-y-auto p-1.5">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">No results found.</Command.Empty>

              {Object.entries(grouped).map(([group, items]) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {items.map((cmd) => {
                    const Icon = cmd.icon ? (ICON_MAP[cmd.icon] ?? null) : null
                    return (
                      <Command.Item
                        key={cmd.id}
                        value={`${cmd.label} ${cmd.keywords ?? ''}`}
                        onSelect={() => { cmd.action(); onOpenChange(false) }}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors aria-selected:bg-muted"
                      >
                        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span className="flex-1">{cmd.label}</span>
                        <span className="text-[11px] text-muted-foreground/40">{cmd.group}</span>
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              ))}
            </Command.List>

            <div className="flex items-center justify-between border-t border-border/50 px-4 py-2">
              <span className="text-xs text-muted-foreground">{commands.length} result{commands.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-medium">&uarr;&darr;</kbd>
                <span>navigate</span>
                <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-medium">&crarr;</kbd>
                <span>open</span>
              </div>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
