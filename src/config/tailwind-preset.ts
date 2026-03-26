import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const saasPreset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // Layout surface tokens
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
        },
        content: 'hsl(var(--content))',
      },
      borderRadius: {
        button: 'var(--button-radius)',
        card: 'var(--card-radius)',
        input: 'var(--input-radius)',
        modal: 'var(--modal-radius)',
      },
      fontFamily: {
        sans: ['var(--font-family)'],
        mono: ['var(--font-family-mono)'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'zoom-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'zoom-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-4px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(4px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out-to-top': {
          from: { transform: 'translateY(0)', opacity: '1' },
          to: { transform: 'translateY(-4px)', opacity: '0' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-out': 'fade-out 150ms ease-in',
        'zoom-in': 'zoom-in 200ms ease-out',
        'zoom-out': 'zoom-out 150ms ease-in',
        'slide-in-from-top': 'slide-in-from-top 200ms ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 200ms ease-out',
        'slide-out-to-top': 'slide-out-to-top 150ms ease-in',
        'page-in': 'page-in 250ms ease-out',
      },
    },
  },
  plugins: [
    // Radix-compatible animation utilities (animate-in, animate-out, fade-in-0, zoom-in-95, etc.)
    plugin(({ addUtilities }) => {
      addUtilities({
        '.animate-in': {
          'animation-name': 'enter',
          'animation-duration': '200ms',
          'animation-timing-function': 'ease-out',
          '--tw-enter-opacity': '1',
          '--tw-enter-scale': '1',
          '--tw-enter-translate-x': '0',
          '--tw-enter-translate-y': '0',
        },
        '.animate-out': {
          'animation-name': 'exit',
          'animation-duration': '150ms',
          'animation-timing-function': 'ease-in',
          '--tw-exit-opacity': '1',
          '--tw-exit-scale': '1',
          '--tw-exit-translate-x': '0',
          '--tw-exit-translate-y': '0',
        },
        '.fade-in-0': { '--tw-enter-opacity': '0' },
        '.fade-out-0': { '--tw-exit-opacity': '0' },
        '.zoom-in-95': { '--tw-enter-scale': '0.95' },
        '.zoom-out-95': { '--tw-exit-scale': '0.95' },
        '.slide-in-from-top-2': { '--tw-enter-translate-y': '-0.5rem' },
        '.slide-in-from-bottom-2': { '--tw-enter-translate-y': '0.5rem' },
        '.slide-in-from-bottom-4': { '--tw-enter-translate-y': '1rem' },
        '.slide-in-from-left-1\\/2': { '--tw-enter-translate-x': '-50%' },
        '.slide-in-from-right-2': { '--tw-enter-translate-x': '0.5rem' },
        '.slide-in-from-top-\\[48\\%\\]': { '--tw-enter-translate-y': '-48%' },
        '.slide-out-to-left-1\\/2': { '--tw-exit-translate-x': '-50%' },
        '.slide-out-to-top-\\[48\\%\\]': { '--tw-exit-translate-y': '-48%' },
        '.slide-out-to-top-2': { '--tw-exit-translate-y': '-0.5rem' },
      })
    }),
  ],
}

export default saasPreset
