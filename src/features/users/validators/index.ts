import { z } from 'zod'

export const inviteUserSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
    email: z.string().email('Email inválido'),
    role: z.enum(['admin', 'user']),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo').optional(),
  role: z.enum(['admin', 'user']).optional(),
  active: z.boolean().optional(),
})

export type InviteUserSchema = z.infer<typeof inviteUserSchema>
export type UpdateUserSchema = z.infer<typeof updateUserSchema>
