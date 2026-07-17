import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'O nome nÃ£o pode estar vazio').max(255),
})

/**
 * GET /api/profile
 *
 * Returns the current authenticated user's profile.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  })
}

/**
 * PUT /api/profile
 *
 * Updates the current user's display name in the database and in Supabase
 * Auth user metadata.
 *
 * Body: { name: string }
 */
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
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

  const parsed = updateProfileSchema.safeParse(body)
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

  const { name } = parsed.data

  try {
    // Update DB record
    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    })

    // Update Supabase Auth metadata (best-effort â€” failure does not block the response)
    try {
      const supabase = await createServerClient()
      await supabase.auth.updateUser({ data: { name } })
    } catch (authErr) {
      console.warn('[PUT /api/profile] Supabase metadata update failed:', authErr)
    }

    return NextResponse.json({ id: user.id, name })
  } catch (err) {
    console.error('[PUT /api/profile]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    )
  }
}
