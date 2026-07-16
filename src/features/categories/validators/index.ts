import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategorySchema = z.infer<typeof createCategorySchema>
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>
