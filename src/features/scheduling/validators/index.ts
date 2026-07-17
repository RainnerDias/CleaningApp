import { z } from 'zod'

/** ISO date string (YYYY-MM-DD or full ISO 8601). */
const isoDate = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), { message: 'Must be a valid ISO date string' })

/** Body for POST /api/schedules/generate */
export const generateScheduleSchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine(
    (v) => {
      if (v.from && v.to) {
        return new Date(v.from) <= new Date(v.to)
      }
      return true
    },
    { message: '`from` must be before or equal to `to`', path: ['from'] }
  )

/** Query params for GET /api/schedules */
export const listSchedulesSchema = z.object({
  from: isoDate,
  to: isoDate,
  userId: z.string().uuid('userId must be a valid UUID').optional(),
  status: z.enum(['pending', 'completed', 'skipped']).optional(),
  roomId: z.string().uuid('roomId must be a valid UUID').optional(),
})

/** Body for PATCH /api/schedules/[id]/status */
export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'skipped']),
})

/** Body for POST /api/schedules/[id]/clock */
export const clockActionSchema = z.object({
  action: z.enum(['in', 'out']),
})

export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>
export type ListSchedulesInput = z.infer<typeof listSchedulesSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
export type ClockActionInput = z.infer<typeof clockActionSchema>
export type ScheduleStatusFilter = 'pending' | 'completed' | 'skipped'
