import * as React from 'react'
import { Send } from 'lucide-react'
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
        'fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:w-96',
        'animate-in slide-in-from-bottom-4 fade-in-0 duration-200',
        className
      )}
      style={{ maxHeight: 'calc(100vh - 160px)' }}
    >
      {/* Header */}
      <div className="flex items-center border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 200, maxHeight: 400 }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">Send a message to start chatting</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-center gap-1 text-muted-foreground px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse delay-100" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse delay-200" />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
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
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
