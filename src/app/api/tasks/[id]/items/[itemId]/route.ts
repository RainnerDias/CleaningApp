import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'

const updateItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  note: z.string().max(2000).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

/**
 * PATCH /api/tasks/:id/items/:itemId
 * Updates a task item's title, note, displayOrder, or active flag.
 * Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
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

  const { itemId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const parsed = updateItemSchema.safeParse(body)
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
    const item = await prisma.taskItem.update({
      where: { id: itemId },
      data: parsed.data,
      select: { id: true, title: true, note: true, displayOrder: true, active: true },
    })
    return NextResponse.json(item)
  } catch {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Task item not found' } },
      { status: 404 }
    )
  }
}

/**
 * DELETE /api/tasks/:id/items/:itemId
 * Deletes a task item.
 * Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
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

  const { itemId } = await params

  try {
    await prisma.taskItem.delete({ where: { id: itemId } })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Task item not found' } },
      { status: 404 }
    )
  }
}
