'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TasksTable } from './TasksTable'
import { TaskDialog } from './TaskDialog'
import { DeleteTaskDialog } from './DeleteTaskDialog'
import { useTasks } from '../hooks/useTasks'
import type { Task } from '../types'
import type { Room } from '@/features/rooms/types'
import type { Category } from '@/features/categories/types'

interface TasksPageClientProps {
  /** Server-fetched tasks used as TanStack Query initial data */
  initialTasks: Task[]
  /** Room list for the task form selectors */
  rooms: Room[]
  /** Category list for the task form selectors */
  categories: Category[]
}

/**
 * Client shell for the Tasks admin page.
 * Manages dialog open/close state and delegates data operations to hooks.
 */
export function TasksPageClient({ initialTasks, rooms, categories }: TasksPageClientProps) {
  const { data: tasks = [], isLoading } = useTasks(initialTasks)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const handleEdit = (task: Task) => {
    setEditingTask(task)
  }

  const handleDelete = (task: Task) => {
    setDeletingTask(task)
  }

  const handleEditOpenChange = (open: boolean) => {
    if (!open) setEditingTask(null)
  }

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) setDeletingTask(null)
  }

  return (
    <div className="px-4 md:px-6 pt-6 pb-8 max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as tarefas de limpeza e suas frequências de execução.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus aria-hidden="true" />
          Nova Tarefa
        </Button>
      </div>

      {/* Tasks table */}
      <TasksTable tasks={tasks} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Create dialog */}
      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        task={null}
        rooms={rooms}
        categories={categories}
      />

      {/* Edit dialog */}
      <TaskDialog
        open={!!editingTask}
        onOpenChange={handleEditOpenChange}
        task={editingTask}
        rooms={rooms}
        categories={categories}
      />

      {/* Delete confirmation dialog */}
      <DeleteTaskDialog
        open={!!deletingTask}
        onOpenChange={handleDeleteOpenChange}
        task={deletingTask}
      />
    </div>
  )
}
