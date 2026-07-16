import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { frequencyRepository } from '@/features/tasks/repositories/taskRepository'
import { frequencyInputSchema } from '@/features/tasks/validators'

type RouteParams = { params: Promise<{ id: string }> }

/** POST /api/tasks/:id/frequency — Upsert the frequency for a task (admin only) */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params

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
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const parsed = frequencyInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid frequency data',
          details: parsed.error.issues,
        },
      },
      { status: 422 }
    )
  }

  try {
    const frequency = await frequencyRepository.upsert(taskId, {
      type: parsed.data.type,
      daysOfWeek: parsed.data.daysOfWeek,
      weekOfMonth: parsed.data.weekOfMonth ?? null,
      dayOfMonth: parsed.data.dayOfMonth ?? null,
    })
    return NextResponse.json(frequency, { status: 201 })
  } catch (err) {
    console.error(`[POST /api/tasks/${taskId}/frequency]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upsert frequency' } },
      { status: 500 }
    )
  }
}

/** DELETE /api/tasks/:id/frequency — Remove the frequency from a task (admin only) */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params

  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  try {
    await frequencyRepository.delete(taskId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error(`[DELETE /api/tasks/${taskId}/frequency]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete frequency' } },
      { status: 500 }
    )
  }
}
