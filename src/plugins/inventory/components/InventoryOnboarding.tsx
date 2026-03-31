import React, { useState } from 'react'
import { Package, Ruler, MapPin, ChevronRight, Check } from 'lucide-react'

const STEPS = [
  { id: 'welcome', icon: Package, title: 'Welcome to Inventory', description: 'Track products, manage stock levels, and monitor movements across your business.' },
  { id: 'units', icon: Ruler, title: 'Measurement Units', description: 'Default units (Unit, Box, Kg, L, etc.) are ready. Customize them anytime in Settings.' },
  { id: 'locations', icon: MapPin, title: 'Stock Locations', description: 'A default storage location has been created. Add more for multi-location tracking.' },
]

export function InventoryOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const Icon = current.icon

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
        <div className="rounded-xl border bg-card p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{current.description}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">Back</button>
            )}
            {isLast ? (
              <button onClick={onComplete} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <Check className="h-4 w-4" /> Start using Inventory
              </button>
            ) : (
              <button onClick={() => setStep(step + 1)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                {step === 0 ? 'Get Started' : 'Next'} <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          {step === 0 && (
            <button onClick={onComplete} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip setup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
