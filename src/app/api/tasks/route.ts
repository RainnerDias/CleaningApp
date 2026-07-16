import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { taskService } from '@/features/tasks/services/taskService'
import { createTaskSchema, frequencyInputSchema } from '@/features/tasks/validators'

/** GET /api/tasks — List all tasks (admin only) */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  try {
    const tasks = await taskService.getAll()
    return NextResponse.json(tasks)
  } catch (err) {
    console.error('[GET /api/tasks]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tasks' } },
      { status: 500 }
    )
  }
}

/** POST /api/tasks — Create a task with optional embedded frequency (admin only) */
export async function POST(request: NextRequest) {
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

  const parsed = createTaskSchema.safeParse(taskRaw)
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
    const task = await taskService.create(
      userId,
      {
        ...parsed.data,
        active: parsed.data.active ?? true,
        goldenRuleApplies: parsed.data.goldenRuleApplies ?? true,
      },
      frequencyData
    )
    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tasks]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create task' } },
      { status: 500 }
    )
  }
}
