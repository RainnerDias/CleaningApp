import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const AVATAR_BUCKET = 'avatars'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

/**
 * POST /api/profile/avatar
 *
 * Uploads the user's avatar to Supabase Storage and updates users.avatarUrl.
 *
 * Body: FormData with a 'file' field (image/*, max 2 MB)
 *
 * Returns: { avatarUrl: string }
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
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
      { error: { code: 'VALIDATION_ERROR', message: 'File size must not exceed 2 MB' } },
      { status: 422 }
    )
  }

  // Derive extension from MIME type (image/jpeg â†’ jpg, image/png â†’ png, etc.)
  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const storagePath = `${user.id}/avatar.${ext}`

  try {
    const supabase = createAdminClient()

    // Upsert: overwrite any existing avatar (same path)
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath)

    // Bust the CDN cache by appending a timestamp query param
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

    // Persist the URL in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    })

    return NextResponse.json({ avatarUrl }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/profile/avatar]', err)
    const message = err instanceof Error ? err.message : 'Failed to upload avatar'
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 })
  }
}
