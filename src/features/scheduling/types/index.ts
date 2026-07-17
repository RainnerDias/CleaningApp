/**
 * Full schedule with all nested relations — used in the admin calendar and user schedule views.
 * This is the client-side type; dates are ISO strings (Prisma Date serializes to JSON string).
 */
export interface ScheduleWithDetails {
  id: string
  /** ISO date string — e.g. "2026-07-16T00:00:00.000Z" */
  date: string
  status: 'pending' | 'completed' | 'skipped'
  completedAt: string | null
  startedAt: string | null
  stoppedAt: string | null
  task: {
    id: string
    title: string
    estimatedMinutes: number
    priority: string
    goldenRuleApplies: boolean
    room: { id: string; name: string; color: string; icon: string }
    category: { id: string; name: string; color: string } | null
  }
  user: { id: string; name: string; avatarUrl: string | null }
  comments: Array<{
    id: string
    comment: string
    createdAt: string
    user: { id: string; name: string }
  }>
  photos: Array<{ id: string; imageUrl: string }>
}
