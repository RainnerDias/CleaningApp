import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, parseISO } from 'date-fns'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedules/today[?userId=<id>][&date=yyyy-MM-dd]
 *
 * Returns schedules for the authenticated user on the given date (defaults to today).
 * Admins may pass ?userId=<id> to fetch another user's schedules.
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
  const requestedUserId = searchParams.get('userId')
  const dateParam = searchParams.get('date')

  const targetUserId = user.role === 'admin' && requestedUserId ? requestedUserId : user.id
  const targetDate = startOfDay(dateParam ? parseISO(dateParam) : new Date())

  try {
    const schedules = await scheduleService.getByDate(targetDate, targetUserId)
    return NextResponse.json(schedules)
  } catch (err) {
    console.error('[GET /api/schedules/today]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch schedules' } },
      { status: 500 }
    )
  }
}
