'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
import type { Room } from '../types'

interface RoomsTableProps {
  rooms: Room[]
  isLoading?: boolean
  onEdit: (room: Room) => void
  onDelete: (room: Room) => void
}

/**
 * Data table for listing rooms with search, status badge, task count,
 * and edit / delete action buttons.
 */
export function RoomsTable({ rooms, isLoading = false, onEdit, onDelete }: RoomsTableProps) {
  const [search, setSearch] = useState('')

  if (isLoading) {
    return <DataTableSkeleton rows={3} columns={5} />
  }

  const filtered = rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        type="search"
        placeholder="Buscar sala..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
        aria-label="Buscar sala por nome"
      />

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium w-12">Cor</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Tarefas</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {search ? 'Nenhuma sala encontrada para a busca.' : 'Nenhuma sala cadastrada.'}
                </td>
              </tr>
            ) : (
              filtered.map((room, index) => (
                <tr
                  key={room.id}
                  className={
                    index < filtered.length - 1
                      ? 'border-b border-border hover:bg-muted/20 transition-colors'
                      : 'hover:bg-muted/20 transition-colors'
                  }
                >
                  {/* Color swatch */}
                  <td className="px-4 py-3">
                    <div
                      className="size-8 rounded-full border border-border/50 flex-shrink-0"
                      style={{ backgroundColor: room.color }}
                      aria-label={`Cor: ${room.color}`}
                    />
                  </td>

                  {/* Name + icon */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base" aria-hidden="true">
                        {room.icon}
                      </span>
                      <span className="font-medium">{room.name}</span>
                    </div>
                  </td>

                  {/* Task count */}
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {room._count?.tasks ?? 0}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={room.active ? 'success' : 'secondary'}>
                      {room.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(room)}
                        aria-label={`Editar sala ${room.name}`}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDelete(room)}
                        aria-label={`Excluir sala ${room.name}`}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 aria-hidden="true" />
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
