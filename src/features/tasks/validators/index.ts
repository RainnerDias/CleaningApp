import { z } from 'zod'

export const createTaskSchema = z.object({
  roomId: z.string().uuid('Sala inválida'),
  categoryId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().uuid('Categoria inválida').optional()
  ),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  estimatedMinutes: z.number().int().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 480 minutos'),
  priority: z.enum(['low', 'medium', 'high']),
  active: z.boolean().optional().default(true),
  goldenRuleApplies: z.boolean().optional().default(true),
})

export const updateTaskSchema = createTaskSchema.partial()

export const createFrequencySchema = z.object({
  taskId: z.string().uuid(),
  type: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional().default([]),
  weekOfMonth: z.number().int().min(1).max(5).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
})

export const updateFrequencySchema = createFrequencySchema.omit({ taskId: true }).partial()

/**
 * Used to validate an embedded frequency object inside a task create/update request.
 * `taskId` is not included — it is derived from the route parameter.
 */
export const frequencyInputSchema = z.object({
  type: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional().default([]),
  weekOfMonth: z.number().int().min(1).max(5).optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
})

export type CreateTaskSchema = z.infer<typeof createTaskSchema>
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>
export type CreateFrequencySchema = z.infer<typeof createFrequencySchema>
export type UpdateFrequencySchema = z.infer<typeof updateFrequencySchema>
export type FrequencyInputSchema = z.infer<typeof frequencyInputSchema>
