import { requireAdmin } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import { ReportsClient } from '@/features/reports/components/ReportsClient'

/**
 * Admin Reports page — server component.
 *
 * Validates admin access, fetches reference data (active rooms and users) for
 * the filter dropdowns, then renders the client shell.
 * The actual report data is fetched client-side via TanStack Query so the page
 * remains fast regardless of the data volume.
 */
export default async function ReportsPage() {
  await requireAdmin()

  const [rooms, users] = await Promise.all([
    prisma.room.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return <ReportsClient rooms={rooms} users={users} />
}
