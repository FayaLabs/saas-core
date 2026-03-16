import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import type { MemberRole } from '../../types'

interface ProtectedRouteProps {
  children?: React.ReactNode
  requiredRole?: MemberRole
  fallback?: React.ReactNode
  onUnauthenticated?: () => void
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children, requiredRole, fallback, onUnauthenticated }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth()
  const { requireRole } = usePermission()

  React.useEffect(() => {
    if (initialized && !loading && !user && onUnauthenticated) {
      onUnauthenticated()
    }
  }, [initialized, loading, user, onUnauthenticated])

  if (!initialized || loading) {
    return <LoadingSkeleton />
  }

  if (!user) {
    return <LoadingSkeleton />
  }

  if (requiredRole && !requireRole(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
