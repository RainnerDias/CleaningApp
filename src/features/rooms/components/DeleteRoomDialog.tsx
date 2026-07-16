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
import { useDeleteRoom } from '../hooks/useRooms'
import type { Room } from '../types'

interface DeleteRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: Room | null
}

/**
 * Confirmation dialog for deleting a room.
 * Warns the user if the room has associated tasks.
 */
export function DeleteRoomDialog({ open, onOpenChange, room }: DeleteRoomDialogProps) {
  const deleteRoom = useDeleteRoom()
  const taskCount = room?._count?.tasks ?? 0

  const handleConfirm = async () => {
    if (!room) return
    try {
      await deleteRoom.mutateAsync(room.id)
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state
    }
  }

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir sala</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a sala <strong>&quot;{room?.name}&quot;</strong>?
            {taskCount > 0 && (
              <>
                {' '}
                <span className="text-destructive font-medium">
                  Esta sala possui {taskCount}{' '}
                  {taskCount === 1 ? 'tarefa associada' : 'tarefas associadas'}. Excluir irá remover
                  as tarefas associadas.
                </span>
              </>
            )}
            {taskCount === 0 && ' Esta ação não pode ser desfeita.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteRoom.error && (
          <p
            className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2 mt-2"
            role="alert"
          >
            {deleteRoom.error.message}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogClose
            render={
              <Button type="button" variant="outline" disabled={deleteRoom.isPending}>
                Cancelar
              </Button>
            }
          />
          <Button
            type="button"
            variant="destructive"
            disabled={deleteRoom.isPending}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {deleteRoom.isPending ? 'Excluindo...' : 'Excluir sala'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  )
}
