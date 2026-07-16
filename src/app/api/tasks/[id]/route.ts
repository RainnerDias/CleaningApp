import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { taskService } from '@/features/tasks/services/taskService'
import { updateTaskSchema, frequencyInputSchema } from '@/features/tasks/validators'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/tasks/:id — Fetch a single task (admin only) */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  try {
    const task = await taskService.getById(id)
    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      )
    }
    return NextResponse.json(task)
  } catch (err) {
    console.error(`[GET /api/tasks/${id}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch task' } },
      { status: 500 }
    )
  }
}

/** PUT /api/tasks/:id — Update a task with optional embedded frequency (admin only) */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  let userId: string
  try {
    const user = await requireAdmin()
    userId = user.id
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

  // Split out the embedded frequency before validating the task schema
  const { frequency: frequencyRaw, ...taskRaw } = body as Record<string, unknown>

  const parsed = updateTaskSchema.safeParse(taskRaw)
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

  // Validate embedded frequency if provided
  let frequencyData: ReturnType<typeof frequencyInputSchema.parse> | undefined
  if (frequencyRaw !== undefined && frequencyRaw !== null) {
    const freqParsed = frequencyInputSchema.safeParse(frequencyRaw)
    if (!freqParsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid frequency data',
            details: freqParsed.error.issues,
          },
        },
        { status: 422 }
      )
    }
    frequencyData = freqParsed.data
  }

  try {
    const task = await taskService.update(userId, id, parsed.data, frequencyData)
    return NextResponse.json(task)
  } catch (err) {
    console.error(`[PUT /api/tasks/${id}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update task' } },
      { status: 500 }
    )
  }
}

/** DELETE /api/tasks/:id — Delete a task (admin only) */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  let userId: string
  try {
    const user = await requireAdmin()
    userId = user.id
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  try {
    await taskService.delete(userId, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error(`[DELETE /api/tasks/${id}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete task' } },
      { status: 500 }
    )
  }
}
