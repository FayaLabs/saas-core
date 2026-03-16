import React, { useState } from 'react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../hooks/useAuth'
import { OAuthButtons } from './OAuthButtons'
import type { AuthProvider } from '../../types'

interface LoginFormProps {
  onSuccess?: () => void
  onForgotPassword?: () => void
  showOAuth?: boolean
  oauthProviders?: Exclude<AuthProvider, 'email'>[]
  className?: string
}

export function LoginForm({
  onSuccess,
  onForgotPassword,
  showOAuth = false,
  oauthProviders = ['google', 'github'],
  className,
}: LoginFormProps) {
  const { signIn, signInWithOAuth, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await signIn(email, password)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message ?? 'Failed to sign in. Please try again.')
    }
  }

  const handleOAuthClick = async (provider: AuthProvider) => {
    setError(null)
    try {
      await signInWithOAuth(provider)
    } catch (err: any) {
      setError(err.message ?? `Failed to sign in with ${provider}.`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4 w-full max-w-sm', className)}
    >
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {onForgotPassword && (
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-muted-foreground hover:text-foreground self-end -mt-2 transition-colors"
        >
          Forgot password?
        </button>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      {showOAuth && oauthProviders.length > 0 && (
        <>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>
          <OAuthButtons
            providers={oauthProviders}
            onProviderClick={handleOAuthClick}
          />
        </>
      )}
    </form>
  )
}
