'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UsersTable } from './UsersTable'
import { InviteUserDialog } from './InviteUserDialog'
import { EditUserDialog } from './EditUserDialog'
import { DisableUserDialog } from './DisableUserDialog'
import { useUsers } from '../hooks/useUsers'
import type { AppUser } from '../types'

interface UsersPageClientProps {
  /** Server-fetched users used as TanStack Query initial data */
  initialUsers: AppUser[]
}

/**
 * Client shell for the Users admin page.
 * Manages dialog open/close state and delegates data operations to hooks.
 */
export function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const { data: users = [], isLoading } = useUsers(initialUsers)

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [togglingUser, setTogglingUser] = useState<AppUser | null>(null)

  const handleEdit = (user: AppUser) => {
    setEditingUser(user)
  }

  const handleToggleActive = (user: AppUser) => {
    setTogglingUser(user)
  }

  const handleEditOpenChange = (open: boolean) => {
    if (!open) setEditingUser(null)
  }

  const handleToggleOpenChange = (open: boolean) => {
    if (!open) setTogglingUser(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os usuários com acesso ao sistema.
          </p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <UserPlus aria-hidden="true" />
          Criar Usuário
        </Button>
      </div>

      {/* Users table */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      {/* Invite dialog */}
      <InviteUserDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />

      {/* Edit dialog */}
      <EditUserDialog open={!!editingUser} onOpenChange={handleEditOpenChange} user={editingUser} />

      {/* Disable / Enable confirmation dialog */}
      <DisableUserDialog
        open={!!togglingUser}
        onOpenChange={handleToggleOpenChange}
        user={togglingUser}
      />
    </div>
  )
}
