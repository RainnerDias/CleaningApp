import 'server-only'

import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { AuthUser } from '@/features/auth/types'

/**
 * Returns the currently authenticated database user, or null if:
 * - No active Supabase session exists
 * - The user record is not found in the database
 * - The user's `active` flag is false
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      active: true,
    },
  })

  if (!dbUser?.active) return null

  const { active: _active, ...authUser } = dbUser
  return authUser as AuthUser
}

/**
 * Like `getCurrentUser`, but throws if the user is not an admin.
 * Use in server actions / route handlers that are admin-only.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return user
}
