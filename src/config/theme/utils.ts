import type { ThemeTokens, SemanticColors, UIPerceptionTokens } from './tokens'
import { lightTheme } from './light'

export interface CreateThemeOptions {
  name?: string
  colors?: Partial<SemanticColors>
  perception?: Partial<UIPerceptionTokens>
  /** Shorthand: single HSL value that auto-derives primary, ring, and accent */
  brand?: string
}

export function createTheme(overrides: CreateThemeOptions): ThemeTokens {
  const colors = { ...lightTheme.colors, ...overrides.colors }

  // Brand shorthand: auto-derive primary, ring, accent from single HSL
  if (overrides.brand) {
    colors.primary = overrides.brand
    colors.primaryForeground = '0 0% 100%'
    colors.ring = overrides.brand
    // Derive accent by shifting hue ~50 degrees
    const parts = overrides.brand.split(' ')
    if (parts.length >= 3) {
      const hue = (parseFloat(parts[0]) - 50 + 360) % 360
      colors.accent = `${hue} ${parts[1]} ${parts[2]}`
      colors.accentForeground = '0 0% 100%'
    }
  }

  return {
    name: overrides.name ?? lightTheme.name,
    colors,
    perception: {
      ...lightTheme.perception,
      ...overrides.perception,
    },
  }
}

const colorVarMap: Record<string, string> = {
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  success: '--success',
  successForeground: '--success-foreground',
  warning: '--warning',
  warningForeground: '--warning-foreground',
}

const perceptionVarMap: Record<string, string> = {
  buttonRadius: '--button-radius',
  cardRadius: '--card-radius',
  inputRadius: '--input-radius',
  modalRadius: '--modal-radius',
  fontFamily: '--font-family',
  fontFamilyMono: '--font-family-mono',
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
}

export function applyTheme(theme: ThemeTokens, element?: HTMLElement): void {
  const target = element ?? document.documentElement

  for (const [key, cssVar] of Object.entries(colorVarMap)) {
    const value = theme.colors[key as keyof typeof theme.colors]
    if (value) {
      target.style.setProperty(cssVar, value)
    }
  }

  for (const [key, cssVar] of Object.entries(perceptionVarMap)) {
    const value = theme.perception[key as keyof typeof theme.perception]
    if (value) {
      target.style.setProperty(cssVar, value)
    }
  }
}

export function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
