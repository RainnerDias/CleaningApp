import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { userService } from '@/features/users/services/userService'
import { updateUserSchema } from '@/features/users/validators'

type RouteParams = { params: Promise<{ id: string }> }

/** PUT /api/users/:id — Update a user's name, role, or active status (admin only) */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

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

  const parsed = updateUserSchema.safeParse(body)
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
    const user = await userService.update(adminId, id, parsed.data)
    return NextResponse.json(user)
  } catch (err) {
    console.error(`[PUT /api/users/${id}]`, err)
    const message = err instanceof Error ? err.message : 'Failed to update user'
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 })
  }
}
