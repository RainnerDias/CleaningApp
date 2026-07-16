'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoomsTable } from './RoomsTable'
import { RoomDialog } from './RoomDialog'
import { DeleteRoomDialog } from './DeleteRoomDialog'
import { useRooms } from '../hooks/useRooms'
import type { Room } from '../types'

interface RoomsPageClientProps {
  /** Server-fetched rooms used as TanStack Query initial data */
  initialRooms: Room[]
}

/**
 * Client shell for the Rooms admin page.
 * Manages dialog open/close state and delegates data operations to hooks.
 */
export function RoomsPageClient({ initialRooms }: RoomsPageClientProps) {
  const { data: rooms = [], isLoading } = useRooms(initialRooms)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)

  const handleEdit = (room: Room) => {
    setEditingRoom(room)
  }

  const handleDelete = (room: Room) => {
    setDeletingRoom(room)
  }

  const handleEditOpenChange = (open: boolean) => {
    if (!open) setEditingRoom(null)
  }

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) setDeletingRoom(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Salas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as salas da casa para organizar as tarefas.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Nova Sala
        </Button>
      </div>

      {/* Rooms table */}
      <RoomsTable rooms={rooms} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Create dialog */}
      <RoomDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} room={null} />

      {/* Edit dialog */}
      <RoomDialog open={!!editingRoom} onOpenChange={handleEditOpenChange} room={editingRoom} />

      {/* Delete confirmation dialog */}
      <DeleteRoomDialog
        open={!!deletingRoom}
        onOpenChange={handleDeleteOpenChange}
        room={deletingRoom}
      />
    </div>
  )
}
