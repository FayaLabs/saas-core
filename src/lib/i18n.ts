import * as React from 'react'

interface I18nConfig {
  defaultLocale: string
  supported: string[]
  translations: Record<string, Record<string, string>>
}

const I18nContext = React.createContext<I18nConfig>({
  defaultLocale: 'en',
  supported: ['en'],
  translations: {},
})

export const I18nProvider = I18nContext.Provider

export function useI18nConfig() {
  return React.useContext(I18nContext)
}

// Default EN translations for saas-core components
export const defaultTranslations: Record<string, string> = {
  'auth.signIn': 'Sign In',
  'auth.signUp': 'Sign Up',
  'auth.signOut': 'Sign Out',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.forgotPassword': 'Forgot Password?',
  'settings.general': 'General',
  'settings.profile': 'Profile',
  'settings.branding': 'Branding',
  'settings.notifications': 'Notifications',
  'settings.save': 'Save Changes',
  'billing.currentPlan': 'Current Plan',
  'billing.upgrade': 'Upgrade',
  'billing.monthly': 'Monthly',
  'billing.yearly': 'Yearly',
  'notifications.title': 'Notifications',
  'notifications.markAllRead': 'Mark all read',
  'notifications.empty': 'No notifications',
  'notifications.whatsNew': "What's New",
  'notifications.inbox': 'Inbox',
  'user.profile': 'Profile',
  'user.settings': 'Settings',
  'user.help': 'Help',
  'user.shortcuts': 'Keyboard Shortcuts',
  'user.theme': 'Theme',
  'user.themeLight': 'Light',
  'user.themeDark': 'Dark',
  'user.themeSystem': 'System',
}
