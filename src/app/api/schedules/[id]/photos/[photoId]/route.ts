import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import { deletePhoto } from '@/lib/supabase/storage'

type RouteParams = { params: Promise<{ id: string; photoId: string }> }

/**
 * DELETE /api/schedules/:id/photos/:photoId
 *
 * Deletes a photo from Supabase Storage and removes the TaskPhoto record.
 *
 * Authorization: user must own the photo (or be an admin).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  const { id: scheduleId, photoId } = await params

  const photo = await prisma.taskPhoto.findUnique({
    where: { id: photoId },
    select: { id: true, userId: true, scheduleId: true, storagePath: true },
  })

  if (!photo) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Photo not found' } },
      { status: 404 }
    )
  }

  // Ensure the photo belongs to the specified schedule
  if (photo.scheduleId !== scheduleId) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Photo not found' } },
      { status: 404 }
    )
  }

  if (user.role !== 'admin' && photo.userId !== user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You do not own this photo' } },
      { status: 403 }
    )
  }

  try {
    await deletePhoto(photo.storagePath)
    await prisma.taskPhoto.delete({ where: { id: photoId } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error(`[DELETE /api/schedules/${scheduleId}/photos/${photoId}]`, err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete photo' } },
      { status: 500 }
    )
  }
}
