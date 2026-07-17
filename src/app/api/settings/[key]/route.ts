import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, requireAdmin } from '@/features/auth/services/authService' // getCurrentUser for GET, requireAdmin for PATCH
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/settings/:key
 *
 * Returns the value of a single Setting by key.
 * Requires authentication — any authenticated user may read settings.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const { key } = await params

  try {
    const setting = await prisma.setting.findUnique({ where: { key } })
    if (!setting) {
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
 * PATCH /api/settings/:key
 *
 * Upserts a setting value. Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    )
  }

  const { key } = await params

  let body: { value?: unknown }
  try {
    body = (await request.json()) as { value?: unknown }
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  if (body.value === undefined || body.value === null) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Field "value" is required' } },
      { status: 422 }
    )
  }

  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: body.value },
      create: { key, value: body.value },
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
