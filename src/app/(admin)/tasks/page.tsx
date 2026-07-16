import { requireAdmin } from '@/features/auth/services/authService'
import { taskService } from '@/features/tasks/services/taskService'
import { roomService } from '@/features/rooms/services/roomService'
import { categoryService } from '@/features/categories/services/categoryService'
import { TasksPageClient } from '@/features/tasks/components/TasksPageClient'
import type { Task } from '@/features/tasks/types'
import type { Room } from '@/features/rooms/types'
import type { Category } from '@/features/categories/types'

/**
 * Admin Tasks page — server component.
 * Validates admin access, fetches initial data, and renders the client shell.
 */
export default async function TasksPage() {
  await requireAdmin()

  const [tasks, rooms, categories] = await Promise.all([
    taskService.getAll(),
    roomService.getAll(),
    categoryService.getAll(),
  ])

  return (
    <TasksPageClient
      initialTasks={tasks as Task[]}
      rooms={rooms as Room[]}
      categories={categories as Category[]}
    />
  )
}
