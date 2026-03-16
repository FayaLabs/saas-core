import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { RecoveryForm } from './RecoveryForm'
import type { AuthProvider } from '../../types'

interface LoginPageProps {
  appName: string
  logo?: React.ReactNode
  showOAuth?: boolean
  oauthProviders?: Exclude<AuthProvider, 'email'>[]
  onSuccess?: () => void
}

type View = 'login' | 'signup' | 'recovery'

export function LoginPage({ appName, logo, showOAuth, oauthProviders, onSuccess }: LoginPageProps) {
  const [view, setView] = useState<View>('login')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          {logo}
          <h1 className="text-2xl font-bold text-foreground">{appName}</h1>
        </div>

        {view === 'login' && (
          <>
            <LoginForm
              onSuccess={onSuccess}
              onForgotPassword={() => setView('recovery')}
              showOAuth={showOAuth}
              oauthProviders={oauthProviders}
            />
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setView('signup')}
                className="text-primary hover:underline font-medium"
              >
                Create account
              </button>
            </p>
          </>
        )}

        {view === 'signup' && (
          <>
            <SignupForm onSuccess={onSuccess} />
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </>
        )}

        {view === 'recovery' && (
          <>
            <RecoveryForm onBackToLogin={() => setView('login')} />
          </>
        )}
      </div>
    </div>
  )
}
