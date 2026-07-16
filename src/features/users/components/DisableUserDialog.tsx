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
import { useUpdateUser } from '../hooks/useUsers'
import type { AppUser } from '../types'

interface DisableUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** User whose active status will be toggled; null when dialog is closed */
  user: AppUser | null
}

/**
 * Confirmation dialog for enabling or disabling a user.
 * Disabling bans the user in Supabase Auth (~100-year ban duration).
 * Enabling removes the ban. Users are never deleted.
 */
export function DisableUserDialog({ open, onOpenChange, user }: DisableUserDialogProps) {
  const updateUser = useUpdateUser()
  const isDisabling = user?.active ?? true

  const handleConfirm = async () => {
    if (!user) return
    try {
      await updateUser.mutateAsync({ id: user.id, active: !user.active })
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state
    }
  }

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDisabling ? 'Desativar usuário' : 'Reativar usuário'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDisabling ? (
              <>
                Desativar <strong>{user?.name}</strong> irá impedir o login e remover atribuições
                futuras.
              </>
            ) : (
              <>
                Reativar <strong>{user?.name}</strong> irá restaurar o acesso ao sistema.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {updateUser.error && (
          <p
            className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2 mt-2"
            role="alert"
          >
            {updateUser.error.message}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogClose
            render={
              <Button type="button" variant="outline" disabled={updateUser.isPending}>
                Cancelar
              </Button>
            }
          />
          <Button
            type="button"
            variant={isDisabling ? 'destructive' : 'default'}
            className={!isDisabling ? 'bg-green-600 hover:bg-green-700 text-white' : undefined}
            disabled={updateUser.isPending}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {updateUser.isPending
              ? isDisabling
                ? 'Desativando...'
                : 'Reativando...'
              : isDisabling
                ? 'Desativar'
                : 'Reativar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  )
}
