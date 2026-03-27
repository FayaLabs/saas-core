import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { RecoveryForm } from './RecoveryForm'
import type { AuthProvider } from '../../types'

interface CenteredLoginProps {
  appName: string
  logo?: React.ReactNode
  tagline?: string
  showOAuth?: boolean
  oauthProviders?: Exclude<AuthProvider, 'email'>[]
  onSuccess?: () => void
}

type View = 'login' | 'signup' | 'recovery'

export function CenteredLogin({ appName, logo, tagline, showOAuth, oauthProviders, onSuccess }: CenteredLoginProps) {
  const [view, setView] = useState<View>('login')

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Card — light */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-2xl sm:p-10">
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">{logo}</div>
          <h1 className="text-2xl font-bold text-foreground">
            {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          {view === 'login' && (
            <p className="mt-1 text-sm text-muted-foreground">
              {tagline ?? (
                <>
                  Don't have an account yet?{' '}
                  <button type="button" onClick={() => setView('signup')} className="font-medium text-primary hover:underline">
                    Sign up
                  </button>
                </>
              )}
            </p>
          )}
          {view === 'signup' && (
            <p className="mt-1 text-sm text-muted-foreground">
              Already have an account?{' '}
              <button type="button" onClick={() => setView('login')} className="font-medium text-primary hover:underline">
                Sign in
              </button>
            </p>
          )}
          {view === 'recovery' && (
            <p className="mt-1 text-sm text-muted-foreground">We'll send you a reset link</p>
          )}
        </div>

        {/* Form — override text colors for dark card */}
        <div>
          {view === 'login' && (
            <LoginForm
              onSuccess={onSuccess}
              onForgotPassword={() => setView('recovery')}
              showOAuth={showOAuth}
              oauthProviders={oauthProviders}
            />
          )}

          {view === 'signup' && (
            <SignupForm onSuccess={onSuccess} />
          )}

          {view === 'recovery' && (
            <RecoveryForm onBackToLogin={() => setView('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
