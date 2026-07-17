/**
 * Shared type definitions for the admin analytics dashboard.
 * Safe to import from both server and client modules.
 */

export interface HeatmapEntry {
  /** ISO date string 'yyyy-MM-dd' */
  date: string
  /** Number of completed tasks on this day */
  completed: number
  /** Total tasks (all statuses) on this day */
  total: number
}

export interface MonthlyTrendEntry {
  /** Abbreviated month label, e.g. "jan/25" */
  month: string
  completed: number
  pending: number
  skipped: number
}

export interface ByRoomEntry {
  roomId: string
  roomName: string
  color: string
  completed: number
  pending: number
}

export interface ByCategoryEntry {
  categoryId: string
  categoryName: string
  color: string
  completed: number
  pending: number
}

export interface ByUserEntry {
  userId: string
  userName: string
  completed: number
  pending: number
  /** Percentage 0-100 */
  completionRate: number
}

export interface RecentComment {
  id: string
  comment: string
  /** ISO timestamp string */
  createdAt: string
  user: { name: string }
  schedule: { task: { title: string } }
}

export interface DashboardData {
  /** Completion rate 0-100, last 30 days */
  completionRate: number
  /** Users where active = true */
  activeUsers: number
  /** Days since last completed schedule; 999 if never */
  daysWithoutActivity: number
  /** Completed schedules, last 30 days */
  completedCount: number
  /** Pending schedules, today only */
  pendingCount: number
  /** Skipped schedules, last 30 days */
  skippedCount: number
  /** Average minutes from schedule date to completedAt, last 30 days */
  avgCompletionMinutes: number
  /** Average actual minutes clocked (stoppedAt - startedAt), last 30 days — 0 if no data */
  avgActualMinutes: number
  /** Per-day activity for the last 90 days */
  heatmap: HeatmapEntry[]
  /** Per-month status counts for the last 12 months */
  monthlyTrend: MonthlyTrendEntry[]
  /** Per-room task counts, last 30 days */
  byRoom: ByRoomEntry[]
  /** Per-category task counts, last 30 days */
  byCategory: ByCategoryEntry[]
  /** Per-user task counts and completion rate, last 30 days */
  byUser: ByUserEntry[]
  /** Most recent 10 comments across all tasks */
  recentComments: RecentComment[]
}
