import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'

const GOLDEN_RULE_DEFAULT_TEXT =
  'Regra de ouro: Retire todos os objetos → limpe embaixo, atrás, em cima e os próprios objetos → recoloque tudo no lugar.'

type RouteParams = { params: Promise<{ key: string }> }

/**
 * GET /api/settings/[key]
 *
 * Returns a setting by key. Public — no authentication required so the
 * Today page (and any unauthenticated context) can read it client-side.
 *
 * If the key is 'golden_rule' and no DB record exists yet, returns the
 * hard-coded default text so the banner is never empty on a fresh install.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { key } = await params

  try {
    const setting = await prisma.setting.findUnique({ where: { key } })

    if (!setting) {
      if (key === 'golden_rule') {
        return NextResponse.json({ key, value: { text: GOLDEN_RULE_DEFAULT_TEXT } })
      }
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Setting "${key}" not found` } },
        { status: 404 }
      )
    }

    return NextResponse.json({ key: setting.key, value: setting.value })
  } catch (err) {
    console.error(`[GET /api/settings/${key}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch setting' } },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/settings/[key]
 *
 * Updates the value of a setting by key. Requires admin authentication.
 * Upserts the record so an admin can create settings that were never seeded.
 *
 * Body: { value: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const { key } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const text = (body as { value?: unknown }).value
  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '"value" must be a non-empty string' } },
      { status: 422 }
    )
  }

  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: { text: text.trim() } },
      create: {
        key,
        value: { text: text.trim() },
        description:
          key === 'golden_rule'
            ? 'Regra de ouro exibida para usuários no painel de hoje'
            : `Setting: ${key}`,
      },
    })

    return NextResponse.json({ key: setting.key, value: setting.value })
  } catch (err) {
    console.error(`[PATCH /api/settings/${key}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update setting' } },
      { status: 500 }
    )
  }
}
