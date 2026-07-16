import 'server-only'
import { createAdminClient } from './admin'

const BUCKET = 'task-photos'

/**
 * Uploads a file to the task-photos Supabase Storage bucket.
 * Returns the public URL and the storage path.
 *
 * @throws {Error} if the upload fails (e.g. bucket does not exist yet)
 */
export async function uploadPhoto(
  file: File,
  path: string
): Promise<{ url: string; path: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/**
 * Deletes a file from the task-photos Supabase Storage bucket by storage path.
 *
 * @throws {Error} if the deletion fails
 */
export async function deletePhoto(path: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}
