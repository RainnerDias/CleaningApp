import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { categoryService } from '@/features/categories/services/categoryService'
import { createCategorySchema } from '@/features/categories/validators'

export const dynamic = 'force-dynamic'

/** GET /api/categories â€” List all categories (admin only) */
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
    const categories = await categoryService.getAll()
    return NextResponse.json(categories)
  } catch (err) {
    console.error('[GET /api/categories]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' } },
      { status: 500 }
    )
  }
}

/** POST /api/categories â€” Create a category (admin only) */
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

  const parsed = createCategorySchema.safeParse(body)
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
    const category = await categoryService.create(userId, parsed.data)
    return NextResponse.json(category, { status: 201 })
  } catch (err) {
    console.error('[POST /api/categories]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' } },
      { status: 500 }
    )
  }
}
