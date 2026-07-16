/**
 * Domain types for the Tasks feature.
 *
 * Prisma's generated types are the source of truth for all data shapes.
 * This module re-exports the relevant types and adds domain-level composites
 * used throughout the application layer.
 *
 * Note: enums are exported as values (which also makes the type available).
 * Model types are exported as `type` exports only — they have no runtime shape.
 */

// ---------------------------------------------------------------------------
// Model types (pure type exports — no runtime cost)
// ---------------------------------------------------------------------------
export type {
  User,
  Room,
  Category,
  Task,
  Frequency,
  Schedule,
  TaskComment,
  TaskPhoto,
  AuditLog,
  Setting,
} from '@prisma/client'

// ---------------------------------------------------------------------------
// Enums (value exports — also make the type available at the call site)
// ---------------------------------------------------------------------------
export { Role, FrequencyType, ScheduleStatus, Priority } from '@prisma/client'

// ---------------------------------------------------------------------------
// Domain composites
// These types combine related entities and are used in service return values
// and API response payloads.
// ---------------------------------------------------------------------------

import type {
  Task,
  Room,
  Category,
  Frequency,
  Schedule,
  User,
  TaskComment,
  TaskPhoto,
  Priority,
  ScheduleStatus,
} from '@prisma/client'

/** A Task with its room, category, and frequency populated. */
export type TaskWithDetails = Task & {
  room: Room
  category: Category | null
  frequency: Frequency | null
}

/** A Schedule with its task, assigned user, comments, and photos. */
export type ScheduleWithDetails = Schedule & {
  task: TaskWithDetails
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>
  comments: TaskComment[]
  photos: TaskPhoto[]
}

/** A Schedule summary used in list views (no nested comments/photos). */
export type ScheduleSummary = Schedule & {
  task: Pick<Task, 'id' | 'title' | 'estimatedMinutes' | 'priority' | 'goldenRuleApplies'>
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>
}

/** A User public profile (excludes internal fields). */
export type UserProfile = Pick<User, 'id' | 'name' | 'email' | 'role' | 'avatarUrl' | 'active'>

/** Payload for creating a new task. */
export type CreateTaskInput = {
  title: string
  roomId: string
  categoryId?: string
  description?: string
  estimatedMinutes?: number
  priority?: Priority
  goldenRuleApplies?: boolean
}

/** Payload for updating a task. */
export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'roomId'>> & {
  roomId?: string
  active?: boolean
}

/** Payload for updating a schedule entry (e.g., marking complete). */
export type UpdateScheduleInput = {
  status: ScheduleStatus
  completedAt?: Date | null
}
