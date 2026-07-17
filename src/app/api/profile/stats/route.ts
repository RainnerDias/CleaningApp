import { NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, startOfDay } from 'date-fns'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/stats
 *
 * Returns the current user's cleaning statistics for the current month.
 *
 * Response: {
 *   completedThisMonth: number,
 *   completionRate: number   â€” percentage (0â€“100), 0 if no schedules exist
 * }
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  try {
    const now = new Date()
    const from = startOfDay(startOfMonth(now))
    const to = startOfDay(endOfMonth(now))

    const rows = await prisma.schedule.groupBy({
      by: ['status'],
      where: {
        assignedTo: user.id,
        date: { gte: from, lte: to },
      },
      _count: { status: true },
    })

    const counts = rows.reduce((acc, row) => ({ ...acc, [row.status]: row._count.status }), {
      completed: 0,
      pending: 0,
      skipped: 0,
    } as Record<string, number>)

    const completedThisMonth = counts.completed ?? 0
    const total = (counts.completed ?? 0) + (counts.pending ?? 0) + (counts.skipped ?? 0)
    const completionRate = total > 0 ? (completedThisMonth / total) * 100 : 0

    return NextResponse.json({ completedThisMonth, completionRate })
  } catch (err) {
    console.error('[GET /api/profile/stats]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } },
      { status: 500 }
    )
  }
}
