import { create, type StoreApi, type UseBoundStore } from 'zustand'
import type { ThemeTokens } from '../config/theme/tokens'
import { lightTheme } from '../config/theme/light'
import { darkTheme } from '../config/theme/dark'
import { applyTheme, getSystemPreference } from '../config/theme/utils'
import type { CreateThemeOptions } from '../config/theme/utils'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  resolvedMode: 'light' | 'dark'
  /** Only the user's partial overrides — NOT a full theme */
  overrides: CreateThemeOptions | null
  setMode: (mode: ThemeMode) => void
  setOverrides: (overrides: CreateThemeOptions | null) => void
  initialize: () => void
  // Keep old API name working
  setCustomTheme: (theme: ThemeTokens | null) => void
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return typeof window !== 'undefined' ? getSystemPreference() : 'light'
  }
  return mode
}

/** Merge base theme (light or dark) with user's partial overrides */
function buildTheme(base: ThemeTokens, overrides: CreateThemeOptions | null): ThemeTokens {
  if (!overrides) return base

  const colors = { ...base.colors }

  // Brand shorthand: derive primary, ring, accent from single HSL
  if (overrides.brand) {
    colors.primary = overrides.brand
    colors.primaryForeground = '0 0% 100%'
    colors.ring = overrides.brand
    const parts = overrides.brand.split(' ')
    if (parts.length >= 3) {
      const hue = (parseFloat(parts[0]) - 50 + 360) % 360
      colors.accent = `${hue} ${parts[1]} ${parts[2]}`
      colors.accentForeground = '0 0% 100%'
    }
  }

  // Apply explicit color overrides (only what the user specified)
  if (overrides.colors) {
    for (const [key, value] of Object.entries(overrides.colors)) {
      if (value !== undefined) {
        (colors as any)[key] = value
      }
    }
  }

  return {
    name: overrides.name ?? base.name,
    colors,
    perception: {
      ...base.perception,
      ...(overrides.perception ?? {}),
    },
  }
}

const STORE_KEY = '__saas_core_theme_store__'

function createThemeStore(): UseBoundStore<StoreApi<ThemeState>> {
  // Window-level singleton to survive linked-package dual-module loading
  if (typeof window !== 'undefined' && (window as any)[STORE_KEY]) {
    return (window as any)[STORE_KEY]
  }

  const store = create<ThemeState>((set, get) => ({
    mode: 'system',
    resolvedMode: 'light',
    overrides: null,

    setMode: (mode) => {
      const resolvedMode = resolveMode(mode)
      set({ mode, resolvedMode })

      const { overrides } = get()
      const baseTheme = resolvedMode === 'dark' ? darkTheme : lightTheme
      const theme = buildTheme(baseTheme, overrides)

      applyTheme(theme)

      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', resolvedMode === 'dark')
      }
    },

    setOverrides: (overrides) => {
      set({ overrides })
      const { resolvedMode } = get()
      const baseTheme = resolvedMode === 'dark' ? darkTheme : lightTheme
      const theme = buildTheme(baseTheme, overrides)
      applyTheme(theme)
    },

    // Legacy compat — if someone passes a full ThemeTokens, store it as overrides
    setCustomTheme: (_theme) => {
      // Ignore — callers should use setOverrides now
    },

    initialize: () => {
      const { mode, setMode } = get()
      setMode(mode)

      if (typeof window !== 'undefined') {
        const mql = window.matchMedia('(prefers-color-scheme: dark)')
        mql.addEventListener('change', () => {
          const current = get()
          if (current.mode === 'system') {
            current.setMode('system')
          }
        })
      }
    },
  }))

  if (typeof window !== 'undefined') {
    (window as any)[STORE_KEY] = store
  }

  return store
}

export const useThemeStore = createThemeStore()
