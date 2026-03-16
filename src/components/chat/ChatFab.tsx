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
        'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isOpen && 'rotate-90',
        className
      )}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
    </button>
  )
}
