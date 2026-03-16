import type { Config } from 'tailwindcss'
import { saasCoreTailwindPreset } from './src/config/tailwind-preset'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [saasCoreTailwindPreset],
  darkMode: 'class',
} satisfies Config
