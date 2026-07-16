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
import { useDeleteTask } from '../hooks/useTasks'
import type { Task } from '../types'

interface DeleteTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
}

/**
 * Confirmation dialog for deleting a task.
 * Warns the user if the task has a frequency (and therefore possibly scheduled entries).
 */
export function DeleteTaskDialog({ open, onOpenChange, task }: DeleteTaskDialogProps) {
  const deleteTask = useDeleteTask()

  const hasFrequency = !!task?.frequency

  const handleConfirm = async () => {
    if (!task) return
    try {
      await deleteTask.mutateAsync(task.id)
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state
    }
  }

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a tarefa <strong>&quot;{task?.title}&quot;</strong>?{' '}
            {hasFrequency && (
              <span className="text-destructive font-medium">
                Esta tarefa possui agendamentos futuros que serão removidos.{' '}
              </span>
            )}
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteTask.error && (
          <p
            className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2 mt-2"
            role="alert"
          >
            {deleteTask.error.message}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogClose
            render={
              <Button type="button" variant="outline" disabled={deleteTask.isPending}>
                Cancelar
              </Button>
            }
          />
          <Button
            type="button"
            variant="destructive"
            disabled={deleteTask.isPending}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {deleteTask.isPending ? 'Excluindo...' : 'Excluir tarefa'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  )
}
