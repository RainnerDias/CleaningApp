import { requireAdmin } from '@/features/auth/services/authService'
import { roomService } from '@/features/rooms/services/roomService'
import { RoomsPageClient } from '@/features/rooms/components/RoomsPageClient'
import type { Room } from '@/features/rooms/types'

/**
 * Admin Rooms page — server component.
 * Validates admin access, fetches initial data, and renders the client shell.
 */
export default async function RoomsPage() {
  await requireAdmin()
  const rooms = await roomService.getAll()

  return <RoomsPageClient initialRooms={rooms as Room[]} />
}
