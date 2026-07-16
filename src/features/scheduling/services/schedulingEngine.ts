'server-only'

import { addDays, startOfDay } from 'date-fns'
import { prisma } from '@/lib/prisma'
import {
  getDatesInRange,
  matchesDayOfWeek,
  matchesBiweekly,
  matchesMonthly,
  isWorkDay,
} from '../lib/dateUtils'
import type { GenerationResult, ScheduleEntry } from '../domain/types'
import type { FrequencyType } from '@prisma/client'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface EngineSettings {
  daysAhead: number
  strategy: string
  workDays: number[]
}

async function getSettings(): Promise<EngineSettings> {
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ['schedule_days_ahead', 'default_assignment_strategy', 'work_days'] },
    },
  })
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value as Record<string, unknown>]))
  return {
    daysAhead: (map['schedule_days_ahead']?.days as number) ?? 30,
    strategy: (map['default_assignment_strategy']?.strategy as string) ?? 'round_robin',
    workDays: (map['work_days']?.days as number[]) ?? [1, 2, 3, 4, 5],
  }
}

async function getActiveUsers(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { active: true, role: 'user' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  return users.map((u) => u.id)
}

// ---------------------------------------------------------------------------
// Frequency matching — exported for unit testing
// ---------------------------------------------------------------------------

/**
 * Determines whether a given date matches a frequency rule.
 *
 * @param date       - The candidate date.
 * @param type       - The FrequencyType value from the Frequency record.
 * @param daysOfWeek - Days of the week this task should occur on (0=Sun, 6=Sat).
 * @param dayOfMonth - For monthly: the specific calendar day (1-31) or null.
 * @param weekOfMonth - For monthly: which week of the month (1-5) or null.
 * @param workDays   - Configured work days (used for daily frequency).
 */
export function doesDateMatchFrequency(
  date: Date,
  type: FrequencyType,
  daysOfWeek: number[],
  dayOfMonth: number | null,
  weekOfMonth: number | null,
  workDays: number[]
): boolean {
  switch (type) {
    case 'daily':
      return isWorkDay(date, workDays)
    case 'weekly':
      return matchesDayOfWeek(date, daysOfWeek)
    case 'biweekly':
      return matchesBiweekly(date, daysOfWeek)
    case 'monthly':
      return matchesMonthly(date, dayOfMonth, weekOfMonth, daysOfWeek)
    case 'custom':
      return matchesDayOfWeek(date, daysOfWeek)
    default:
      return false
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates Schedule records for all active tasks over the given date range.
 *
 * Idempotent: uses `createMany` with `skipDuplicates: true`, so running the
 * engine multiple times for the same range will never produce duplicate rows.
 *
 * Assignment strategy: round-robin per task across all active users.
 *
 * @param fromDate - Start of the range (inclusive). Defaults to today.
 * @param toDate   - End of the range (inclusive). Defaults to today + daysAhead.
 */
export async function generateSchedules(fromDate?: Date, toDate?: Date): Promise<GenerationResult> {
  const [settings, activeUsers] = await Promise.all([getSettings(), getActiveUsers()])

  const from = fromDate ? startOfDay(fromDate) : startOfDay(new Date())
  const to = toDate ? startOfDay(toDate) : addDays(from, settings.daysAhead)
  const emptyResult: GenerationResult = {
    generated: 0,
    skipped: 0,
    dateRange: { from, to },
    assignmentCounts: {},
  }

  if (activeUsers.length === 0) {
    return emptyResult
  }

  const tasks = await prisma.task.findMany({
    where: { active: true },
    include: { frequency: true },
  })

  const dates = getDatesInRange(from, to)

  // Build all candidate entries
  const entries: ScheduleEntry[] = []
  const userIndex: Record<string, number> = {}

  for (const task of tasks) {
    if (!task.frequency) continue

    const { type, daysOfWeek, dayOfMonth, weekOfMonth } = task.frequency

    for (const date of dates) {
      const matches = doesDateMatchFrequency(
        date,
        type,
        daysOfWeek,
        dayOfMonth,
        weekOfMonth,
        settings.workDays
      )
      if (!matches) continue

      // Round-robin: each task tracks its own user cursor independently
      if (!(task.id in userIndex)) userIndex[task.id] = 0
      const assignedTo = activeUsers[userIndex[task.id] % activeUsers.length]
      userIndex[task.id]++

      entries.push({ date: startOfDay(date), taskId: task.id, assignedTo, status: 'pending' })
    }
  }

  if (entries.length === 0) {
    return emptyResult
  }

  // Batch-insert in chunks of 100 — skip rows that violate the unique constraint
  const BATCH_SIZE = 100
  let generated = 0
  let skipped = 0
  const assignmentCounts: Record<string, number> = {}

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    const result = await prisma.schedule.createMany({
      data: batch,
      skipDuplicates: true,
    })
    generated += result.count
    skipped += batch.length - result.count

    for (const entry of batch) {
      assignmentCounts[entry.assignedTo] = (assignmentCounts[entry.assignedTo] ?? 0) + 1
    }
  }

  return { generated, skipped, dateRange: { from, to }, assignmentCounts }
}
