import { z } from 'zod'

export const inviteUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'user']),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo').optional(),
  role: z.enum(['admin', 'user']).optional(),
  active: z.boolean().optional(),
})

export type InviteUserSchema = z.infer<typeof inviteUserSchema>
export type UpdateUserSchema = z.infer<typeof updateUserSchema>
