import { z } from 'zod'

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  icon: z.string().min(1, 'Ícone é obrigatório').max(100, 'Ícone muito longo'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
  displayOrder: z.number().int().min(0, 'Ordem de exibição deve ser >= 0').optional(),
})

export const updateRoomSchema = createRoomSchema.partial().extend({
  active: z.boolean().optional(),
})

export const reorderRoomsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.number().int().min(0),
    })
  ),
})

export type CreateRoomSchema = z.infer<typeof createRoomSchema>
export type UpdateRoomSchema = z.infer<typeof updateRoomSchema>
export type ReorderRoomsSchema = z.infer<typeof reorderRoomsSchema>
