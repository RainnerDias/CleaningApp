import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

const addCommentSchema = z.object({
  comment: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be at most 2000 characters'),
})

/**
 * POST /api/schedules/:id/comments
 *
 * Adds a comment to a schedule entry.
 * Body: { comment: string } — min 1 char, max 2000 chars
 *
 * Authorization: user must be assigned to this schedule (or admin).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const { id: scheduleId } = await params

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: { assignedTo: true },
  })

  if (!schedule) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Schedule not found' } },
      { status: 404 }
    )
  }

  if (user.role !== 'admin' && schedule.assignedTo !== user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You are not assigned to this schedule' } },
      { status: 403 }
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

  const parsed = addCommentSchema.safeParse(body)
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
    const comment = await prisma.taskComment.create({
      data: {
        scheduleId,
        userId: user.id,
        comment: parsed.data.comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        id: comment.id,
        comment: comment.comment,
        createdAt: comment.createdAt,
        user: comment.user,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error(`[POST /api/schedules/${scheduleId}/comments]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save comment' } },
      { status: 500 }
    )
  }
}
