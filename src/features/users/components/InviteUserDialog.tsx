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
import { inviteUserSchema, type InviteUserSchema } from '../validators'
import { useInviteUser } from '../hooks/useUsers'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const DEFAULT_VALUES: InviteUserSchema = {
  name: '',
  email: '',
  role: 'user',
}

/**
 * Modal dialog for inviting a new user by email.
 * Supabase sends the invitation email; the DB record is created on acceptance.
 */
export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const inviteUser = useInviteUser()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserSchema>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: DEFAULT_VALUES,
  })

  /* Reset form when dialog closes */
  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES)
      inviteUser.reset()
    }
  }, [open, reset, inviteUser])

  const onSubmit = async (data: InviteUserSchema) => {
    try {
      await inviteUser.mutateAsync(data)
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="invite-user-description">
        <DialogHeader>
          <DialogTitle>Convidar Usuário</DialogTitle>
          <DialogDescription id="invite-user-description">
            Preencha os dados abaixo para enviar um convite de acesso.
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
            <Label htmlFor="invite-name">Nome *</Label>
            <Input
              id="invite-name"
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

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="joao@exemplo.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Papel *</Label>
            <select
              id="invite-role"
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

          {/* Info box */}
          <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Um email de convite será enviado para o endereço fornecido.
          </div>

          {/* Mutation error */}
          {inviteUser.error && (
            <p
              className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2"
              role="alert"
            >
              {inviteUser.error.message}
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
              {isSubmitting ? 'Enviando convite...' : 'Enviar convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
