import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/settings?key=<key>
 *
 * Returns the value of a single Setting by key.
 * Requires authentication — any authenticated user may read settings.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const key = request.nextUrl.searchParams.get('key')
  if (!key) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Query parameter "key" is required' } },
      { status: 422 }
    )
  }

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
    console.error('[GET /api/settings]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch setting' } },
      { status: 500 }
    )
  }
}
