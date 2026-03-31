import React from 'react'
import type { PluginManifest } from '../../types/plugins'
import type { AgendaPluginOptions } from './config'
import { resolveConfig } from './config'
import { AgendaPage } from './AgendaPage'
import { createSupabaseAgendaProvider } from './data/supabase'
import { createAgendaStore } from './store'
import { agendaRegistries } from './registries'
import { PluginSettingsPanel } from '../../components/plugins/PluginSettingsPanel'
import { AgendaGeneralSettings } from './components/AgendaGeneralSettings'
import { ConnectedHolidaysSettings } from '../../components/settings/ConnectedHolidaysSettings'
import { setScheduleBlockConfig } from '../../lib/schedule-config'

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createAgendaPlugin(options?: AgendaPluginOptions): PluginManifest {
  const config = resolveConfig(options)
  const provider = options?.dataProvider ?? createSupabaseAgendaProvider()
  const store = createAgendaStore(provider)

  // Register schedule block config globally so ScheduleEditor can read it
  setScheduleBlockConfig({
    defaults: config.scheduleBlockDefaults,
    showServices: !!config.serviceLookup,
    showConcurrent: true,
    showBookingWindow: true,
  })

  const PageComponent: React.FC<any> = () =>
    React.createElement(AgendaPage, { config, provider, store })

  return {
    id: 'agenda',
    name: config.labels.pageTitle,
    icon: 'Calendar',
    version: '1.0.0',
    scope: options?.scope ?? 'universal',
    verticalId: options?.verticalId,
    defaultEnabled: true,
    dependencies: [],

    navigation: [
      {
        section: options?.navSection ?? 'main',
        position: options?.navPosition ?? 2,
        label: config.labels.pageTitle,
        route: '/agenda',
        icon: 'Calendar',
        permission: { feature: 'appointments', action: 'read' as const },
      },
    ],

    routes: [
      {
        path: '/agenda',
        component: PageComponent,
        permission: { feature: 'appointments', action: 'read' as const },
      },
    ],

    widgets: [],

    aiTools: [
      {
        id: 'agenda.list-appointments',
        name: 'listAppointments',
        description: 'Lists upcoming appointments for a given date or date range, optionally filtered by professional.',
        icon: 'Calendar',
        mode: 'read' as const,
        category: 'Scheduling',
        parameters: {
          type: 'object' as const,
          properties: {
            date: { type: 'string' as const, description: 'Date (YYYY-MM-DD) or "today", "tomorrow", "this week"' },
            professional: { type: 'string' as const, description: 'Professional name to filter by' },
          },
        },
        suggestions: [
          { label: "What's on the agenda today?" },
          { label: 'Show me tomorrow\'s appointments' },
          { label: 'Who has the most bookings this week?' },
        ],
        permission: { feature: 'appointments', action: 'read' as const },
      },
      {
        id: 'agenda.create-appointment',
        name: 'createAppointment',
        description: 'Creates a new appointment for a client with a specific professional and service.',
        icon: 'CalendarPlus',
        mode: 'persist' as const,
        category: 'Scheduling',
        parameters: {
          type: 'object' as const,
          properties: {
            client: { type: 'string' as const, description: 'Client name' },
            professional: { type: 'string' as const, description: 'Professional name' },
            service: { type: 'string' as const, description: 'Service name' },
            date: { type: 'string' as const, description: 'Date (YYYY-MM-DD)' },
            time: { type: 'string' as const, description: 'Time (HH:MM)' },
          },
          required: ['client', 'professional', 'service', 'date', 'time'],
        },
        suggestions: [
          { label: 'Book a haircut for Sarah tomorrow at 10am' },
        ],
        permission: { feature: 'appointments', action: 'create' as const },
      },
      {
        id: 'agenda.check-availability',
        name: 'checkAvailability',
        description: 'Checks available time slots for a professional on a given date.',
        icon: 'Clock',
        mode: 'read' as const,
        category: 'Scheduling',
        parameters: {
          type: 'object' as const,
          properties: {
            professional: { type: 'string' as const, description: 'Professional name' },
            date: { type: 'string' as const, description: 'Date (YYYY-MM-DD) or "today", "tomorrow"' },
            duration: { type: 'number' as const, description: 'Required duration in minutes' },
          },
          required: ['professional', 'date'],
        },
        suggestions: [
          { label: 'When is Ana available tomorrow?' },
          { label: 'Find a 90-minute slot for Carlos this week' },
        ],
        permission: { feature: 'appointments', action: 'read' as const },
      },
    ],

    registries: agendaRegistries,

    settings: [
      {
        id: 'agenda',
        label: 'Agenda',
        icon: 'Calendar',
        component: (() => {
          const AgendaSettingsTab: React.FC = () =>
            React.createElement(PluginSettingsPanel, {
              title: 'Agenda Settings',
              subtitle: 'Working hours, scheduling preferences, and confirmations',
              generalSettings: React.createElement(AgendaGeneralSettings),
              customTabs: [
                { id: 'holidays', label: 'Holidays', icon: 'TreePalm', content: React.createElement(ConnectedHolidaysSettings) },
              ],
              registries: agendaRegistries,
              routeBase: '/settings/agenda',
            })
          AgendaSettingsTab.displayName = 'AgendaSettingsTab'
          return AgendaSettingsTab
        })(),
        order: 5,
        permission: { feature: 'appointments', action: 'read' as const },
      },
    ],
  }
}

// Re-export types for consumers
export type { AgendaPluginOptions } from './config'
export type { ResolvedAgendaConfig } from './config'
export type { AgendaDataProvider } from './data/types'
