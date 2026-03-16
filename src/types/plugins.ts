import type React from 'react'

export interface PluginManifest {
  id: string
  name: string
  icon: string
  version: string
  navigation: {
    section: 'main' | 'secondary' | 'settings'
    position: number
    label: string
    route: string
  }[]
  settings?: {
    tab: string
    component: React.ComponentType
  }[]
  routes: {
    path: string
    component: React.ComponentType
    guard?: 'authenticated' | 'role'
    roles?: string[]
  }[]
  floatingUI?: {
    component: React.ComponentType
    position: 'bottom-right' | 'bottom-left'
  }[]
  entities?: string[]
  permissions?: string[]
}

export interface PluginContext {
  tenant: { id: string; slug: string }
  user: { id: string; role: string }
  theme: Record<string, string>
}
