import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { PluginRegistryManager } from '../../../components/plugins/PluginRegistryManager'
import type { PluginRegistryDef } from '../../../types/plugins'

export function FinancialSettings({ registries, routeBase, onClose }: {
  registries: PluginRegistryDef[]
  routeBase: string
  onClose: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold">Financial Settings</h2>
          <p className="text-xs text-muted-foreground">Manage payment methods, accounts, and configurations</p>
        </div>
      </div>

      <PluginRegistryManager registries={registries} routeBase={routeBase} />
    </div>
  )
}
