import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { categoryService } from '@/features/categories/services/categoryService'
import { updateCategorySchema } from '@/features/categories/validators'

type RouteParams = { params: Promise<{ id: string }> }

/** PUT /api/categories/:id — Update a category (admin only) */
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

  const parsed = updateCategorySchema.safeParse(body)
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
    const category = await categoryService.update(userId, id, parsed.data)
    return NextResponse.json(category)
  } catch (err) {
    console.error(`[PUT /api/categories/${id}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' } },
      { status: 500 }
    )
  }
}

/** DELETE /api/categories/:id — Delete a category (admin only) */
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
    await categoryService.delete(userId, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error(`[DELETE /api/categories/${id}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' } },
      { status: 500 }
    )
  }
}
