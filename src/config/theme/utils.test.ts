import { describe, it, expect } from 'vitest'
import { createTheme } from './utils'
import { lightTheme } from './light'

describe('createTheme', () => {
  it('returns a complete theme with defaults when no overrides', () => {
    const theme = createTheme({})
    expect(theme.name).toBe(lightTheme.name)
    expect(theme.colors.primary).toBe(lightTheme.colors.primary)
    expect(theme.perception.buttonRadius).toBe(lightTheme.perception.buttonRadius)
  })

  it('merges partial color overrides', () => {
    const theme = createTheme({
      colors: { primary: '330 70% 55%' },
    })
    expect(theme.colors.primary).toBe('330 70% 55%')
    expect(theme.colors.secondary).toBe(lightTheme.colors.secondary)
  })

  it('supports brand shorthand', () => {
    const theme = createTheme({ brand: '330 70% 55%' })
    expect(theme.colors.primary).toBe('330 70% 55%')
    expect(theme.colors.ring).toBe('330 70% 55%')
    expect(theme.colors.primaryForeground).toBe('0 0% 100%')
    // Accent should be derived (hue - 50)
    expect(theme.colors.accent).toMatch(/^280/)
  })

  it('overrides perception tokens', () => {
    const theme = createTheme({
      perception: { buttonRadius: '9999px' },
    })
    expect(theme.perception.buttonRadius).toBe('9999px')
    expect(theme.perception.cardRadius).toBe(lightTheme.perception.cardRadius)
  })

  it('sets custom name', () => {
    const theme = createTheme({ name: 'beauty' })
    expect(theme.name).toBe('beauty')
  })
})
