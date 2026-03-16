import * as React from 'react'
import { Toaster, toast } from 'sonner'

interface ToastProviderProps {
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
  theme?: 'light' | 'dark' | 'system'
}

function ToastProvider({
  position = 'bottom-right',
  theme = 'system',
}: ToastProviderProps) {
  return (
    <Toaster
      position={position}
      theme={theme}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group border-border bg-background text-foreground shadow-lg',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary/90',
          cancelButton:
            'bg-muted text-muted-foreground hover:bg-muted/80',
          closeButton:
            'border-border bg-background text-foreground hover:bg-muted',
        },
      }}
    />
  )
}

export { ToastProvider, toast }
