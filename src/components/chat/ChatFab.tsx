import * as React from 'react'
import { MessageCircle, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useChatStore } from '../../stores/chat.store'
import { useOrganizationStore } from '../../stores/organization.store'

interface ChatFabProps {
  className?: string
}

export function ChatFab({ className }: ChatFabProps) {
  const { isOpen, toggleOpen } = useChatStore()
  const currentOrg = useOrganizationStore((s) => s.currentOrg)

  // Hide when no org is loaded (connection error, onboarding)
  if (!currentOrg) return null

  return (
    <button
      onClick={toggleOpen}
      className={cn(
        'fixed bottom-4 right-4 z-50 hidden h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-foreground text-background shadow-lg transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:flex',
        isOpen && 'bg-muted text-foreground hover:bg-muted/80',
        className
      )}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
    </button>
  )
}
