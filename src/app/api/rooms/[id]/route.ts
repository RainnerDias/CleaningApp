import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { roomService } from '@/features/rooms/services/roomService'
import { updateRoomSchema } from '@/features/rooms/validators'

type RouteParams = { params: Promise<{ id: string }> }

/** PUT /api/rooms/:id — Update a room (admin only) */
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

  const parsed = updateRoomSchema.safeParse(body)
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
    const room = await roomService.update(userId, id, parsed.data)
    return NextResponse.json(room)
  } catch (err) {
    console.error(`[PUT /api/rooms/${id}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update room' } },
      { status: 500 }
    )
  }
}

/** DELETE /api/rooms/:id — Delete a room (admin only) */
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
    await roomService.delete(userId, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error(`[DELETE /api/rooms/${id}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete room' } },
      { status: 500 }
    )
  }
}
