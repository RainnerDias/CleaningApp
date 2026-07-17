import { NextResponse } from 'next/server'
import { startOfDay } from 'date-fns'
import { getCurrentUser } from '@/features/auth/services/authService'
import { scheduleService } from '@/features/scheduling/services/scheduleService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedules/today
 *
 * Returns today's schedules for the currently authenticated user.
 * No admin role required â€” users can only see their own schedules.
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
    const today = startOfDay(new Date())
    const schedules = await scheduleService.getByDate(today, user.id)
    return NextResponse.json(schedules)
  } catch (err) {
    console.error('[GET /api/schedules/today]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: "Failed to fetch today's schedules" } },
      { status: 500 }
    )
  }
}
