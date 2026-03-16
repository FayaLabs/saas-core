import { createClient } from '@supabase/supabase-js'
import type { Request, Response, NextFunction } from 'express'
import type { MemberRole } from '../../types'

export interface AuthenticatedUser {
  id: string
  email: string
  role: MemberRole
  tenantId: string
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser
  tenantId: string
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function authenticate() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header.' })
    }

    const token = authHeader.slice(7)

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token.' })
    }

    try {
      const supabase = getSupabaseAdmin()

      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token.' })
      }

      const tenantId = req.headers['x-tenant-id'] as string
        || user.app_metadata?.tenant_id
        || user.user_metadata?.tenant_id

      if (!tenantId) {
        return res.status(401).json({ error: 'No tenant context found.' })
      }

      const { data: membership, error: memberError } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .single()

      if (memberError || !membership) {
        return res.status(403).json({ error: 'User is not a member of this tenant.' })
      }

      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = {
        id: user.id,
        email: user.email ?? '',
        role: membership.role as MemberRole,
        tenantId,
      }
      authenticatedReq.tenantId = tenantId

      next()
    } catch (err) {
      return res.status(401).json({ error: 'Authentication failed.' })
    }
  }
}
