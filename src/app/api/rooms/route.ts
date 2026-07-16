import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { roomService } from '@/features/rooms/services/roomService'
import { createRoomSchema } from '@/features/rooms/validators'

/** GET /api/rooms — List all rooms (admin only) */
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
    const rooms = await roomService.getAll()
    return NextResponse.json(rooms)
  } catch (err) {
    console.error('[GET /api/rooms]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rooms' } },
      { status: 500 }
    )
  }
}

/** POST /api/rooms — Create a room (admin only) */
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

  const parsed = createRoomSchema.safeParse(body)
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
    const room = await roomService.create(userId, parsed.data)
    return NextResponse.json(room, { status: 201 })
  } catch (err) {
    console.error('[POST /api/rooms]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create room' } },
      { status: 500 }
    )
  }
}
