import * as React from 'react'
import { cn } from '../../lib/cn'
import { usePlugins, useWidgets } from '../../hooks/usePlugins'
import type { PluginRuntimeContext, PluginWidgetZone } from '../../types/plugins'

interface WidgetSlotProps {
  zone: PluginWidgetZone
  className?: string
  contextOverrides?: Partial<PluginRuntimeContext>
}

export function WidgetSlot({ zone, className, contextOverrides }: WidgetSlotProps) {
  const runtime = usePlugins()
  const widgets = useWidgets(zone, contextOverrides)

  if (widgets.length === 0) {
    return null
  }

  const content = widgets.map((widget) => {
    const Component = widget.component as React.ComponentType<any>
    return (
      <Component
        key={`${widget.plugin.id}:${widget.id}`}
        config={widget.config}
        runtime={{
          ...runtime.context,
          ...contextOverrides,
        }}
        plugin={widget.plugin}
        widget={widget}
      />
    )
  })

  if (!className) {
    return <>{content}</>
  }

  return <div className={cn(className)}>{content}</div>
}
