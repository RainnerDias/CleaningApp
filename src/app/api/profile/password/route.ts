import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/features/auth/services/authService'
import { createServerClient } from '@/lib/supabase/server'

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'A confirmação da senha é obrigatória'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

/**
 * POST /api/profile/password
 *
 * Changes the authenticated user's password via Supabase Auth.
 * Uses the user's own session — does NOT require the current password
 * (Supabase handles this at the session level).
 *
 * Body: { newPassword: string, confirmPassword: string }
 */
export async function POST(request: NextRequest) {
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

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid request data',
          details: parsed.error.issues,
        },
      },
      { status: 422 }
    )
  }

  const { newPassword } = parsed.data

  try {
    // Use the session-aware server client so updateUser is applied to the
    // currently authenticated user (not a service-role admin operation).
    const supabase = await createServerClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/profile/password]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to change password' } },
      { status: 500 }
    )
  }
}
