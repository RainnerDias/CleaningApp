import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { clockActionSchema } from '@/features/scheduling/validators'

/**
 * POST /api/schedules/:id/clock
 *
 * Records a clock-in or clock-out timestamp for a schedule.
 * Body: { action: 'in' | 'out' }
 *
 * Authorization:
 *  - Admins may clock in/out for any schedule.
 *  - Regular users may only clock in/out for schedules assigned to them.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = clockActionSchema.safeParse(body)
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
    const updated =
      parsed.data.action === 'in'
        ? await scheduleService.clockIn(id, user.id)
        : await scheduleService.clockOut(id, user.id)

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
      if (err.message === 'Clock-in required') {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'Clock-in must be recorded before clock-out' } },
          { status: 409 }
        )
      }
    }
    console.error('[POST /api/schedules/:id/clock]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to record clock action' } },
      { status: 500 }
    )
  }
}
