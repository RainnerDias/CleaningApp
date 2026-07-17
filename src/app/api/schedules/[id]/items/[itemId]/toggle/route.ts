import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'

/**
 * POST /api/schedules/:id/items/:itemId/toggle
 *
 * Toggles the completion state of a single subtask within a schedule.
 * Creates a completion record on first toggle; updates completedAt on subsequent calls.
 *
 * Returns: { completionId: string, completedAt: string | null, scheduleStatus: string }
 *
 * Authorization:
 *  - Admins may toggle any schedule item.
 *  - Regular users may only toggle items in schedules assigned to them.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const { id: scheduleId, itemId: taskItemId } = await params

  try {
    const completion = await scheduleService.toggleItemCompletion(scheduleId, taskItemId, user.id)

    // Re-read the updated schedule status to return it
    const { prisma } = await import('@/lib/prisma')
    const updatedSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { status: true },
    })

    return NextResponse.json({
      completionId: completion.id,
      completedAt: completion.completedAt?.toISOString() ?? null,
      scheduleStatus: updatedSchedule?.status ?? 'pending',
    })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Schedule not found') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Schedule not found' } },
          { status: 404 }
        )
      }
      if (err.message === 'Unauthorized') {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'You are not assigned to this schedule' } },
          { status: 403 }
        )
      }
    }
    console.error('[POST /api/schedules/:id/items/:itemId/toggle]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle item completion' } },
      { status: 500 }
    )
  }
}
