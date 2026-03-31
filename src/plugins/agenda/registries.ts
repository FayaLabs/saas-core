import type { PluginRegistryDef } from '../../types/plugins'

// ---------------------------------------------------------------------------
// Agenda plugin has no CRUD registries — appointments are managed via the
// calendar UI, not table-based CRUD pages. Working hours are managed in a
// dedicated view. This file exports an empty array for consistency.
// ---------------------------------------------------------------------------

export const agendaRegistries: PluginRegistryDef[] = []
