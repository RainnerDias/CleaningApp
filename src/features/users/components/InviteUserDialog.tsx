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
import { nativeSelectClass } from '@/lib/utils'
import { inviteUserSchema, type InviteUserSchema } from '../validators'
import { useInviteUser } from '../hooks/useUsers'

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const selectClass = nativeSelectClass

const DEFAULT_VALUES: InviteUserSchema = {
  name: '',
  email: '',
  role: 'user',
  password: '',
  confirmPassword: '',
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const inviteUser = useInviteUser()
  // Destructure stable references to avoid infinite loop in useEffect
  const { reset: resetMutation } = inviteUser

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserSchema>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES)
      resetMutation()
    }
  }, [open, reset, resetMutation])

  const onSubmit = async (data: InviteUserSchema) => {
    try {
      await inviteUser.mutateAsync(data)
      onOpenChange(false)
    } catch {
      // Error surfaced via mutation state
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="invite-user-description">
        <DialogHeader>
          <DialogTitle>Criar Usuário</DialogTitle>
          <DialogDescription id="invite-user-description">
            Preencha os dados e defina a senha inicial. Compartilhe as credenciais com o usuário —
            ele poderá alterá-la no perfil após o primeiro acesso.
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

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-password">Senha inicial *</Label>
            <Input
              id="invite-password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-confirm-password">Confirmar senha *</Label>
            <Input
              id="invite-confirm-password"
              type="password"
              placeholder="Repita a senha"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
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
              {isSubmitting ? 'Criando usuário...' : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
