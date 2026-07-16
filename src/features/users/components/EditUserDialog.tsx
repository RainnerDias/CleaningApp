'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { updateUserSchema, type UpdateUserSchema } from '../validators'
import { useUpdateUser } from '../hooks/useUsers'
import type { AppUser } from '../types'

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** User being edited; null when dialog is closed */
  user: AppUser | null
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Modal dialog for editing a user's name and role.
 * Email is read-only — it can only be changed via Supabase Auth.
 */
export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: '', role: 'user' },
  })

  /* Populate form when a user is selected for editing */
  useEffect(() => {
    if (user) {
      reset({ name: user.name, role: user.role })
    } else {
      reset({ name: '', role: 'user' })
      updateUser.reset()
    }
  }, [user, reset, updateUser])

  const onSubmit = async (data: UpdateUserSchema) => {
    if (!user) return
    try {
      await updateUser.mutateAsync({ id: user.id, ...data })
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="edit-user-description">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription id="edit-user-description">
            Atualize o nome e o papel do usuário abaixo.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          {/* Email — read only */}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <p className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              {user?.email ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">O email não pode ser alterado por aqui.</p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nome *</Label>
            <Input
              id="edit-name"
              placeholder="Ex: João Silva"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Papel *</Label>
            <select
              id="edit-role"
              className={selectClass}
              aria-invalid={!!errors.role}
              {...register('role')}
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
            {errors.role && (
              <p className="text-xs text-destructive" role="alert">
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Mutation error */}
          {updateUser.error && (
            <p
              className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2"
              role="alert"
            >
              {updateUser.error.message}
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
              {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
