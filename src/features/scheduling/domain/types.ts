import type { FrequencyType, ScheduleStatus } from '@prisma/client'

export interface ScheduleEntry {
  date: Date
  taskId: string
  assignedTo: string
  status: ScheduleStatus
}

export interface GenerationResult {
  generated: number
  skipped: number
  dateRange: { from: Date; to: Date }
  assignmentCounts: Record<string, number>
}

export interface FrequencyRule {
  taskId: string
  type: FrequencyType
  daysOfWeek: number[]
  weekOfMonth: number | null
  dayOfMonth: number | null
}

export interface TaskWithFrequency {
  id: string
  title: string
  active: boolean
  frequency: FrequencyRule | null
}
