import * as React from 'react'
import { MessageCircle, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useChatStore } from '../../stores/chat.store'

interface ChatFabProps {
  className?: string
}

export function ChatFab({ className }: ChatFabProps) {
  const { isOpen, toggleOpen } = useChatStore()

  return (
    <button
      onClick={toggleOpen}
      className={cn(
        'fixed bottom-6 right-6 z-50 hidden h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-gradient-to-b from-card via-card to-muted text-muted-foreground shadow-md transition-all hover:scale-105 hover:text-foreground hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:flex',
        isOpen && 'rotate-90',
        className
      )}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
    </button>
  )
}
