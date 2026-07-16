import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import { uploadPhoto } from '@/lib/supabase/storage'

type RouteParams = { params: Promise<{ id: string }> }

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * POST /api/schedules/:id/photos
 *
 * Uploads a photo for a schedule entry.
 * Body: FormData with a 'file' field (image/*, max 10 MB)
 *
 * Authorization: user must be assigned to this schedule (or admin).
 *
 * Degrades gracefully: returns a clear error if the Supabase storage
 * bucket does not exist (CONFIG-2 not yet completed).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const { id: scheduleId } = await params

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: { assignedTo: true },
  })

  if (!schedule) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Schedule not found' } },
      { status: 404 }
    )
  }

  if (user.role !== 'admin' && schedule.assignedTo !== user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You are not assigned to this schedule' } },
      { status: 403 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid form data' } },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'A file field is required' } },
      { status: 422 }
    )
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Only image files are allowed' } },
      { status: 422 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'File size must not exceed 10 MB' } },
      { status: 422 }
    )
  }

  const timestamp = Date.now()
  // Sanitise the filename to avoid path injection
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${user.id}/${scheduleId}/${timestamp}-${safeName}`

  try {
    const { url } = await uploadPhoto(file, storagePath)

    const photo = await prisma.taskPhoto.create({
      data: {
        scheduleId,
        userId: user.id,
        imageUrl: url,
        storagePath,
      },
      select: { id: true, imageUrl: true },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (err) {
    console.error(`[POST /api/schedules/${scheduleId}/photos]`, err)
    const message = err instanceof Error ? err.message : 'Failed to upload photo'
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 })
  }
}
