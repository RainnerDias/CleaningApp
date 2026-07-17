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
    items: {
      id: string
      title: string
      note: string | null
      displayOrder: number
    }[]
  }
  user: { id: string; name: string; avatarUrl: string | null }
  comments: Array<{
    id: string
    comment: string
    createdAt: string
    user: { id: string; name: string }
  }>
  photos: Array<{ id: string; imageUrl: string }>
  itemCompletions: {
    id: string
    taskItemId: string
    completedAt: string | null
  }[]
}

/**
 * Derived type for displaying a task item with its completion state in a schedule.
 * Built client-side by joining task.items with schedule.itemCompletions.
 */
export type TaskItemWithCompletion = {
  /** task_items.id */
  id: string
  title: string
  note: string | null
  displayOrder: number
  /** null = not done */
  completedAt: string | null
  /** schedule_item_completions.id — null if the completion record does not exist yet */
  completionId: string | null
}
