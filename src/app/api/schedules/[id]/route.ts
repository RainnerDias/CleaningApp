import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

const reassignSchema = z.object({
  assignedTo: z.string().uuid('assignedTo must be a valid UUID'),
})

const scheduleInclude = {
  task: {
    include: {
      room: { select: { id: true, name: true, color: true, icon: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  },
  user: { select: { id: true, name: true, avatarUrl: true } },
  comments: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  photos: true,
} as const

/**
 * PUT /api/schedules/:id
 *
 * Reassigns a schedule entry to a different user.
 * Body: { assignedTo: string (UUID) }
 *
 * Authorization: admin only.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const parsed = reassignSchema.safeParse(body)
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
    const schedule = await prisma.schedule.update({
      where: { id },
      data: { assignedTo: parsed.data.assignedTo },
      include: scheduleInclude,
    })
    return NextResponse.json(schedule)
  } catch (err) {
    console.error(`[PUT /api/schedules/${id}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to reassign schedule' } },
      { status: 500 }
    )
  }
}
