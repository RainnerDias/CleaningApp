import type { Priority, FrequencyType } from '@prisma/client'

export interface Task {
  id: string
  roomId: string
  categoryId: string | null
  title: string
  description: string | null
  estimatedMinutes: number
  priority: Priority
  active: boolean
  goldenRuleApplies: boolean
  createdAt: Date
  updatedAt: Date
  room: { id: string; name: string; color: string; icon: string }
  category: { id: string; name: string; color: string } | null
  frequency: Frequency | null
}

export interface Frequency {
  id: string
  taskId: string
  type: FrequencyType
  daysOfWeek: number[]
  weekOfMonth: number | null
  dayOfMonth: number | null
}

export interface CreateTaskInput {
  roomId: string
  categoryId?: string
  title: string
  description?: string
  estimatedMinutes: number
  priority: Priority
  active?: boolean
  goldenRuleApplies?: boolean
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}

export interface CreateFrequencyInput {
  taskId: string
  type: FrequencyType
  daysOfWeek?: number[]
  weekOfMonth?: number
  dayOfMonth?: number
}

export interface UpdateFrequencyInput extends Partial<Omit<CreateFrequencyInput, 'taskId'>> {}

/** Payload used by hooks when creating a task — frequency is embedded. */
export interface CreateTaskPayload extends CreateTaskInput {
  frequency?: {
    type: FrequencyType
    daysOfWeek?: number[]
    weekOfMonth?: number | null
    dayOfMonth?: number | null
  }
}

/** Payload used by hooks when updating a task — frequency is embedded. */
export interface UpdateTaskPayload extends UpdateTaskInput {
  id: string
  frequency?: {
    type: FrequencyType
    daysOfWeek?: number[]
    weekOfMonth?: number | null
    dayOfMonth?: number | null
  }
}
