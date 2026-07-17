import { NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { generateSchedules } from '@/features/scheduling/services/schedulingEngine'
import { generateScheduleSchema } from '@/features/scheduling/validators'

export const dynamic = 'force-dynamic'

/** POST /api/v1/schedules/generate â€” Trigger schedule generation (admin only). */
export async function POST(request: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json().catch(() => ({}))
  } catch {
    body = {}
  }

  const parsed = generateScheduleSchema.safeParse(body)
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

  try {
    const from = parsed.data.from ? new Date(parsed.data.from) : undefined
    const to = parsed.data.to ? new Date(parsed.data.to) : undefined
    const result = await generateSchedules(from, to)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error('[POST /api/schedules/generate]', err)
    const message = err instanceof Error ? err.message : 'Failed to generate schedules'
    return NextResponse.json({ error: { code: 'GENERATION_FAILED', message } }, { status: 500 })
  }
}
