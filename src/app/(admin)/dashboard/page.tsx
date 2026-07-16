import { requireAdmin } from '@/features/auth/services/authService'
import { getDashboardData } from '@/features/dashboard/services/dashboardService'
import { DashboardClient } from '@/features/dashboard/components/DashboardClient'

/**
 * Admin Dashboard page — server component.
 *
 * Validates admin access, fetches analytics data server-side for a fast first
 * paint, then passes it as `initialData` to the client shell. TanStack Query
 * treats the server data as immediately stale and refetches in the background.
 */
export default async function DashboardPage() {
  await requireAdmin()

  // Fetch directly via the service (not the API route) to avoid an extra HTTP
  // round-trip during server-side rendering.
  const initialData = await getDashboardData()

  return <DashboardClient initialData={initialData} />
}
