import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'
import { listSchedulesSchema } from '@/features/scheduling/validators'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedules?from=YYYY-MM-DD&to=YYYY-MM-DD[&userId=uuid]
 *
 * Authorization:
 *  - Admins may query any user's schedules (or all schedules when userId is omitted).
 *  - Regular users may only query their own schedules; the `userId` param is ignored.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const { searchParams } = request.nextUrl
  const rawParams = {
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    userId: searchParams.get('userId') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    roomId: searchParams.get('roomId') ?? undefined,
  }

  const parsed = listSchedulesSchema.safeParse(rawParams)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parsed.error.issues,
        },
      },
      { status: 422 }
    )
  }

  const { from, to, userId: requestedUserId, status, roomId } = parsed.data

  // Non-admins are always scoped to their own data
  const resolvedUserId = user.role === 'admin' ? requestedUserId : user.id

  try {
    const schedules = await scheduleService.getByDateRange(
      new Date(from),
      new Date(to),
      resolvedUserId,
      status,
      roomId
    )
    return NextResponse.json(schedules)
  } catch (err) {
    console.error('[GET /api/schedules]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch schedules' } },
      { status: 500 }
    )
  }
}
