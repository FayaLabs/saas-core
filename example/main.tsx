/**
 * Minimal example app demonstrating @fayz/saas-core usage.
 * Run with: npx vite example/
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import { createSaasApp } from '../src'
import { AppShell } from '../src/components/layout'
import { LoginForm } from '../src/components/auth'
import { SettingsPage } from '../src/components/settings'
import { PlanSelector } from '../src/components/billing'
import { NotificationBell } from '../src/components/notifications'
import { ToastProvider } from '../src/components/notifications'
import { createTheme } from '../src/config/theme/utils'
import type { NavigationItem } from '../src/types/layout'
import type { Plan } from '../src/types/billing'
import '../src/styles.css'

// Custom theme
const exampleTheme = createTheme({
  name: 'example',
  colors: {
    primary: '250 70% 55%',
    primaryForeground: '0 0% 100%',
  },
})

// Navigation
const navigation: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', route: '/', section: 'main', position: 0 },
  { id: 'clients', label: 'Clients', icon: 'Users', route: '/clients', section: 'main', position: 1 },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar', route: '/calendar', section: 'main', position: 2 },
  { id: 'billing', label: 'Billing', icon: 'CreditCard', route: '/billing', section: 'secondary', position: 0 },
  { id: 'settings', label: 'Settings', icon: 'Settings', route: '/settings', section: 'settings', position: 0 },
]

// Plans
const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with the basics',
    features: ['5 clients', '10 appointments/month', 'Email support'],
    prices: { monthly: 0, yearly: 0 },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    features: ['Unlimited clients', 'Unlimited appointments', 'Analytics', 'Priority support'],
    prices: { monthly: 29, yearly: 290 },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams',
    features: ['Everything in Pro', 'Custom branding', 'API access', 'Dedicated support'],
    prices: { monthly: 99, yearly: 990 },
  },
]

// Create the app
const { Provider } = createSaasApp({
  theme: exampleTheme,
  layout: 'sidebar',
  navigation,
  billing: { plans },
})

// Simple router
function useRoute() {
  const [route, setRoute] = React.useState(window.location.hash.slice(1) || '/')

  React.useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return route
}

function ExampleApp() {
  const route = useRoute()
  const [showLogin, setShowLogin] = React.useState(false)

  const user = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    avatarUrl: undefined,
  }

  const handleNavigate = (r: string) => {
    window.location.hash = r
  }

  return (
    <Provider>
      <ToastProvider />
      {showLogin ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-full max-w-md p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Welcome Back</h1>
            <LoginForm
              onSuccess={() => setShowLogin(false)}
              showOAuth
              oauthProviders={['google', 'github']}
            />
          </div>
        </div>
      ) : (
        <AppShell
          variant="sidebar"
          navigation={navigation}
          user={user}
          onNavigate={handleNavigate}
          logo={<span className="text-xl font-bold text-primary">Example SaaS</span>}
        >
          <div className="p-6">
            {route === '/' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                  <NotificationBell />
                </div>
                <p className="text-muted-foreground">Welcome to your SaaS dashboard.</p>
              </div>
            )}
            {route === '/billing' && (
              <div>
                <h1 className="text-2xl font-bold mb-6">Choose a Plan</h1>
                <PlanSelector
                  plans={plans}
                  currentPlanId="free"
                  interval="monthly"
                  onIntervalChange={() => {}}
                  onSelectPlan={(id) => alert(`Selected plan: ${id}`)}
                />
              </div>
            )}
            {route === '/settings' && <SettingsPage />}
            {!['/','/ billing', '/settings'].includes(route) && (
              <div>
                <h1 className="text-2xl font-bold mb-4">{route.slice(1).charAt(0).toUpperCase() + route.slice(2)}</h1>
                <p className="text-muted-foreground">This is a placeholder for the {route.slice(1)} page.</p>
              </div>
            )}
          </div>
        </AppShell>
      )}
    </Provider>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<ExampleApp />)
