import React, { useState } from 'react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../hooks/useAuth'

interface RecoveryFormProps {
  onSuccess?: () => void
  onBackToLogin?: () => void
  className?: string
}

export function RecoveryForm({
  onSuccess,
  onBackToLogin,
  className,
}: RecoveryFormProps) {
  const { resetPassword, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await resetPassword(email)
      setSubmitted(true)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message ?? 'Failed to send reset email. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className={cn('flex flex-col gap-4 w-full max-w-sm text-center', className)}>
        <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-6">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
            Check your email
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            We sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
          </p>
        </div>
        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to login
          </button>
        )}
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4 w-full max-w-sm', className)}
    >
      <p className="text-sm text-muted-foreground">
        Enter your email address and we will send you a link to reset your password.
      </p>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="recovery-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="recovery-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? 'Sending...' : 'Send reset link'}
      </button>

      {onBackToLogin && (
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to login
        </button>
      )}
    </form>
  )
}
