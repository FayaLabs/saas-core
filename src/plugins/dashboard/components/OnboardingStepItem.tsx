import React from 'react'
import * as LucideIcons from 'lucide-react'
import { Check } from 'lucide-react'
import type { OnboardingStep } from '../types'

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  return (LucideIcons as any)[name] ?? LucideIcons.Circle
}

export function OnboardingStepItem({ step, completed, onAction }: {
  step: OnboardingStep
  completed: boolean
  onAction: () => void
}) {
  const Icon = getIcon(step.icon)

  return (
    <button
      type="button"
      onClick={completed ? undefined : onAction}
      disabled={completed}
      className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
        completed
          ? 'opacity-60'
          : 'hover:bg-muted/50 cursor-pointer'
      }`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        completed ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
      }`}>
        {completed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
          {step.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{step.description}</p>
      </div>
      {!completed && (
        <LucideIcons.ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  )
}
