'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorPicker } from '@/components/ui/color-picker'
import { createCategorySchema, type CreateCategorySchema } from '../validators'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'
import type { Category } from '../types'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, the dialog is in edit mode */
  category?: Category | null
}

/**
 * Modal dialog for creating or editing a Category.
 * Handles form state, validation, and submission internally.
 */
export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const isEditing = !!category

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategorySchema>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      color: '#6366f1',
    },
  })

  /* Populate form when editing */
  useEffect(() => {
    if (category) {
      reset({ name: category.name, color: category.color })
    } else {
      reset({ name: '', color: '#6366f1' })
    }
  }, [category, reset])

  const onSubmit = async (data: CreateCategorySchema) => {
    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({ id: category.id, ...data })
      } else {
        await createCategory.mutateAsync(data)
      }
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state
    }
  }

  const mutationError = isEditing ? updateCategory.error : createCategory.error

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="category-dialog-description">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Criar Categoria'}</DialogTitle>
          <DialogDescription id="category-dialog-description">
            {isEditing
              ? 'Atualize os detalhes da categoria abaixo.'
              : 'Preencha os detalhes para cadastrar uma nova categoria.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Nome *</Label>
            <Input
              id="category-name"
              placeholder="Ex: Limpeza Pesada"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Cor *</Label>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <ColorPicker
                  label="Selecionar cor"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            {errors.color && (
              <p className="text-xs text-destructive" role="alert">
                {errors.color.message}
              </p>
            )}
          </div>

          {/* Mutation error */}
          {mutationError && (
            <p
              className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2"
              role="alert"
            >
              {mutationError.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              }
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
