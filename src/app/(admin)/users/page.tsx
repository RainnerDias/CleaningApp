import { requireAdmin } from '@/features/auth/services/authService'
import { userService } from '@/features/users/services/userService'
import { UsersPageClient } from '@/features/users/components/UsersPageClient'
import type { AppUser } from '@/features/users/types'

/**
 * Admin Users page — server component.
 * Validates admin access, fetches initial data, and renders the client shell.
 */
export default async function UsersPage() {
  await requireAdmin()
  const users = await userService.getAll()

  return <UsersPageClient initialUsers={users as AppUser[]} />
}
