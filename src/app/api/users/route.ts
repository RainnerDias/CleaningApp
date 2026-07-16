import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { userService } from '@/features/users/services/userService'
import { inviteUserSchema } from '@/features/users/validators'

/** GET /api/users — List all users (admin only) */
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
    const users = await userService.getAll()
    return NextResponse.json(users)
  } catch (err) {
    console.error('[GET /api/users]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } },
      { status: 500 }
    )
  }
}

/** POST /api/users — Invite a new user via email (admin only) */
export async function POST(request: NextRequest) {
  let adminId: string

  try {
    const admin = await requireAdmin()
    adminId = admin.id
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

  const parsed = inviteUserSchema.safeParse(body)
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
    const user = await userService.invite(adminId, parsed.data)
    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error('[POST /api/users]', err)
    const message = err instanceof Error ? err.message : 'Failed to invite user'
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 })
  }
}
