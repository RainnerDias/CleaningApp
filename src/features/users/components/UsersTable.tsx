'use client'

import { useState } from 'react'
import { Pencil, UserCheck, UserX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
import type { AppUser } from '../types'

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UsersTableProps {
  users: AppUser[]
  isLoading?: boolean
  onEdit: (user: AppUser) => void
  onToggleActive: (user: AppUser) => void
}

/**
 * Data table for listing users with avatar, search, role badge,
 * status badge, schedule count, and edit / enable-disable actions.
 */
export function UsersTable({ users, isLoading = false, onEdit, onToggleActive }: UsersTableProps) {
  const [search, setSearch] = useState('')

  if (isLoading) {
    return <DataTableSkeleton rows={4} columns={6} />
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        type="search"
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
        aria-label="Buscar usuário por nome ou email"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium w-12">Avatar</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Email</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Papel</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Agendamentos</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                      <Users className="size-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {search
                        ? 'Nenhum usuário encontrado para a busca.'
                        : 'Nenhum usuário cadastrado ainda.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((user, index) => (
                <tr
                  key={user.id}
                  className={
                    index < filtered.length - 1
                      ? 'border-b border-border hover:bg-muted/40 transition-colors'
                      : 'hover:bg-muted/40 transition-colors'
                  }
                >
                  {/* Avatar */}
                  <td className="px-4 py-3">
                    <div
                      className="size-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: getAvatarColor(user.name) }}
                      aria-label={`Avatar de ${user.name}`}
                    >
                      {getInitials(user.name)}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <span className="font-medium">{user.name}</span>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {user.email}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {user.role === 'admin' ? (
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Administrador
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Usuário
                      </Badge>
                    )}
                  </td>

                  {/* Schedule count */}
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {user._count?.schedules ?? 0}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={user.active ? 'success' : 'secondary'}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(user)}
                        aria-label={`Editar usuário ${user.name}`}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onToggleActive(user)}
                        aria-label={
                          user.active
                            ? `Desativar usuário ${user.name}`
                            : `Reativar usuário ${user.name}`
                        }
                        className={
                          user.active
                            ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                            : 'text-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }
                      >
                        {user.active ? (
                          <UserX aria-hidden="true" />
                        ) : (
                          <UserCheck aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
