import { requireAdmin } from '@/features/auth/services/authService'
import { AdminCalendarClient } from '@/features/scheduling/components/AdminCalendarClient'

/**
 * Admin Calendar page — server component.
 * Validates admin access and delegates rendering to the client shell.
 */
export default async function CalendarPage() {
  await requireAdmin()
  return <AdminCalendarClient />
}
