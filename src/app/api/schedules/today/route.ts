import { NextRequest, NextResponse } from 'next/server'
import { startOfDay } from 'date-fns'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedules/today[?userId=<id>]
 *
 * Returns today's schedules for the authenticated user.
 * Admins may pass ?userId=<id> to preview another user's schedules.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const requestedUserId = request.nextUrl.searchParams.get('userId')
  const targetUserId = user.role === 'admin' && requestedUserId ? requestedUserId : user.id

  try {
    const today = startOfDay(new Date())
    const schedules = await scheduleService.getByDate(today, targetUserId)
    return NextResponse.json(schedules)
  } catch (err) {
    console.error('[GET /api/schedules/today]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: "Failed to fetch today's schedules" } },
      { status: 500 }
    )
  }
}
