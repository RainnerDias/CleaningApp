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
import { createRoomSchema, type CreateRoomSchema } from '../validators'
import { useCreateRoom, useUpdateRoom } from '../hooks/useRooms'
import type { Room } from '../types'

interface RoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided, the dialog is in edit mode */
  room?: Room | null
}

/**
 * Modal dialog for creating or editing a Room.
 * Handles form state, validation, and submission internally.
 */
export function RoomDialog({ open, onOpenChange, room }: RoomDialogProps) {
  const isEditing = !!room

  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomSchema>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      icon: '',
      color: '#6366f1',
      displayOrder: 0,
    },
  })

  /* Populate form when editing */
  useEffect(() => {
    if (room) {
      reset({
        name: room.name,
        icon: room.icon,
        color: room.color,
        displayOrder: room.displayOrder,
      })
    } else {
      reset({ name: '', icon: '', color: '#6366f1', displayOrder: 0 })
    }
  }, [room, reset])

  const onSubmit = async (data: CreateRoomSchema) => {
    try {
      if (isEditing && room) {
        await updateRoom.mutateAsync({ id: room.id, ...data })
      } else {
        await createRoom.mutateAsync(data)
      }
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state; no additional handling needed
    }
  }

  const mutationError = isEditing ? updateRoom.error : createRoom.error

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="room-dialog-description">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Sala' : 'Criar Sala'}</DialogTitle>
          <DialogDescription id="room-dialog-description">
            {isEditing
              ? 'Atualize os detalhes da sala abaixo.'
              : 'Preencha os detalhes para cadastrar uma nova sala.'}
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
            <Label htmlFor="room-name">Nome *</Label>
            <Input
              id="room-name"
              placeholder="Ex: Cozinha"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <Label htmlFor="room-icon">
              Ícone * <span className="text-xs font-normal text-muted-foreground">(emoji)</span>
            </Label>
            <Input
              id="room-icon"
              placeholder="Ex: 🍳 🛁 🛏️ 🚿"
              aria-invalid={!!errors.icon}
              {...register('icon')}
            />
            {errors.icon && (
              <p className="text-xs text-destructive" role="alert">
                {errors.icon.message}
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

          {/* Display Order */}
          <div className="space-y-1.5">
            <Label htmlFor="room-order">Ordem de exibição</Label>
            <Input
              id="room-order"
              type="number"
              min={0}
              placeholder="0"
              aria-invalid={!!errors.displayOrder}
              {...register('displayOrder', { valueAsNumber: true })}
            />
            {errors.displayOrder && (
              <p className="text-xs text-destructive" role="alert">
                {errors.displayOrder.message}
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
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar sala'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
