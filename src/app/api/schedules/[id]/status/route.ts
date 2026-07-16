import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { updateStatusSchema } from '@/features/scheduling/validators'

/**
 * PATCH /api/schedules/:id/status
 *
 * Updates the status of a schedule entry.
 * Body: { status: 'pending' | 'completed' | 'skipped' }
 *
 * Authorization:
 *  - Admins may update any schedule.
 *  - Regular users may only update schedules assigned to them.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const parsed = updateStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: parsed.error.issues,
        },
      },
      { status: 422 }
    )
  }

  const { id } = await params

  try {
    const updated = await scheduleService.updateStatus(id, user.id, parsed.data.status)
    return NextResponse.json(updated)
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
    console.error('[PATCH /api/schedules/:id/status]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update schedule status' } },
      { status: 500 }
    )
  }
}
