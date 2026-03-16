import { useCallback } from 'react'
import { useLocaleStore } from '../stores/locale.store'
import { useI18nConfig, defaultTranslations } from '../lib/i18n'

export function useTranslation() {
  const { locale } = useLocaleStore()
  const config = useI18nConfig()

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // Look up in current locale translations, then defaults
      const translations = config.translations[locale] ?? {}
      let value = translations[key] ?? defaultTranslations[key] ?? key

      // Simple interpolation: {{name}} -> value
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue))
        }
      }

      return value
    },
    [locale, config.translations]
  )

  return { t, locale }
}
