import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'

const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  note: z.string().max(2000, 'Note too long').optional(),
  displayOrder: z.number().int().min(0).optional(),
})

/**
 * GET /api/tasks/:id/items
 * Returns all active task items for the given task, ordered by displayOrder.
 * Admin only.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    )
  }

  const { id: taskId } = await params

  const items = await prisma.taskItem.findMany({
    where: { taskId },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      title: true,
      note: true,
      displayOrder: true,
      active: true,
      createdAt: true,
    },
  })

  return NextResponse.json(items)
}

/**
 * POST /api/tasks/:id/items
 * Creates a new task item.
 * Admin only.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    )
  }

  const { id: taskId } = await params

  // Verify task exists
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } })
  if (!task) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Task not found' } },
      { status: 404 }
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

  const parsed = createItemSchema.safeParse(body)
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

  // Default displayOrder to current max + 1
  const maxOrder = await prisma.taskItem.aggregate({
    where: { taskId },
    _max: { displayOrder: true },
  })
  const displayOrder = parsed.data.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1

  const item = await prisma.taskItem.create({
    data: {
      taskId,
      title: parsed.data.title,
      note: parsed.data.note ?? null,
      displayOrder,
    },
    select: {
      id: true,
      title: true,
      note: true,
      displayOrder: true,
      active: true,
      createdAt: true,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
