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
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group border bg-background text-foreground shadow-lg rounded-lg',
          title: 'text-sm font-semibold',
          description: 'text-sm opacity-80',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary/90',
          cancelButton:
            'bg-muted text-muted-foreground hover:bg-muted/80',
          closeButton:
            '!static !transform-none !border-0 !bg-transparent !shadow-none !rounded-md !p-0.5 !h-5 !w-5 !right-0 !top-0 !left-auto opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity [&>svg]:!h-3 [&>svg]:!w-3 !text-current',
          error:
            'border-destructive/30 bg-destructive/10 text-destructive [&_[data-icon]>svg]:text-destructive [&_[data-description]]:text-destructive/80',
          success:
            'border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 [&_[data-icon]>svg]:text-emerald-600 dark:[&_[data-icon]>svg]:text-emerald-400 [&_[data-description]]:text-emerald-700/80 dark:[&_[data-description]]:text-emerald-400/80',
          warning:
            'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 [&_[data-icon]>svg]:text-amber-600 dark:[&_[data-icon]>svg]:text-amber-400 [&_[data-description]]:text-amber-700/80 dark:[&_[data-description]]:text-amber-400/80',
          info:
            'border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300 [&_[data-icon]>svg]:text-blue-600 dark:[&_[data-icon]>svg]:text-blue-400 [&_[data-description]]:text-blue-700/80 dark:[&_[data-description]]:text-blue-400/80',
        },
      }}
    />
  )
}

export { ToastProvider, toast }
