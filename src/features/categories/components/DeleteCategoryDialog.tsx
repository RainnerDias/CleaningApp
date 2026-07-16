'use client'

import {
  AlertDialogRoot,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteCategory } from '../hooks/useCategories'
import type { Category } from '../types'

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}

/**
 * Confirmation dialog for deleting a category.
 * Warns the user if the category has associated tasks.
 */
export function DeleteCategoryDialog({ open, onOpenChange, category }: DeleteCategoryDialogProps) {
  const deleteCategory = useDeleteCategory()
  const taskCount = category?._count?.tasks ?? 0

  const handleConfirm = async () => {
    if (!category) return
    try {
      await deleteCategory.mutateAsync(category.id)
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state
    }
  }

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a categoria <strong>&quot;{category?.name}&quot;</strong>
            ?
            {taskCount > 0 && (
              <>
                {' '}
                <span className="text-destructive font-medium">
                  Esta categoria possui {taskCount}{' '}
                  {taskCount === 1 ? 'tarefa associada' : 'tarefas associadas'}. Excluir irá remover
                  a associação das tarefas.
                </span>
              </>
            )}
            {taskCount === 0 && ' Esta ação não pode ser desfeita.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteCategory.error && (
          <p
            className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2 mt-2"
            role="alert"
          >
            {deleteCategory.error.message}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogClose
            render={
              <Button type="button" variant="outline" disabled={deleteCategory.isPending}>
                Cancelar
              </Button>
            }
          />
          <Button
            type="button"
            variant="destructive"
            disabled={deleteCategory.isPending}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {deleteCategory.isPending ? 'Excluindo...' : 'Excluir categoria'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  )
}
