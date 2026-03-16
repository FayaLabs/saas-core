import type { Response, NextFunction } from 'express'
import type { MemberRole } from '../../types'
import type { AuthenticatedRequest } from './authenticate'

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  staff: 2,
  viewer: 1,
}

export function requireRole(...allowedRoles: MemberRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0
    const hasAccess = allowedRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] ?? 0
      return userLevel >= requiredLevel
    })

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Insufficient permissions.',
        required: allowedRoles,
        current: user.role,
      })
    }

    next()
  }
}
