import * as React from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useChatStore, type ChatMessage } from '../../stores/chat.store'
import { useChat } from '../../hooks/useChat'

interface ChatPanelProps {
  title?: string
  apiEndpoint?: string
  systemPrompt?: string
  className?: string
}

export function ChatPanel({
  title = 'Chat',
  apiEndpoint,
  systemPrompt,
  className,
}: ChatPanelProps) {
  const { isOpen, messages, isStreaming } = useChatStore()
  const { sendMessage } = useChat({ apiEndpoint, systemPrompt })
  const [input, setInput] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage(text)
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden bg-card',
        'inset-0 bottom-16 rounded-none border-0 shadow-none',
        'md:inset-auto md:bottom-20 md:right-6 md:w-[22rem] md:rounded-2xl md:border md:border-border/50 md:shadow-2xl sm:md:w-[24rem]',
        'animate-in slide-in-from-bottom-4 fade-in-0 duration-200',
        className
      )}
      style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'calc(100vh - 140px)' : undefined }}
    >
      {/* Header */}
      <div className="flex items-center px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-3 space-y-2.5" style={{ minHeight: 200, maxHeight: 420 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">How can I help you today?</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-center gap-1.5 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:300ms]" />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 pt-0">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 pl-4 transition-colors focus-within:border-foreground/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-30"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-md bg-foreground text-background'
            : 'rounded-bl-md bg-muted text-foreground'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
