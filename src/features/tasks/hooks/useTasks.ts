'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types'

export const TASKS_QUERY_KEY = ['tasks'] as const

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { error?: { message?: string } }).error?.message ??
        `Request failed with status ${res.status}`
    )
  }
  return res.json() as Promise<T>
}

/** Fetches all tasks. Accepts optional server-fetched data as initial value. */
export function useTasks(initialData?: Task[]) {
  return useQuery<Task[]>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: () => fetch('/api/tasks').then((r) => handleResponse<Task[]>(r)),
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
  })
}

/** Mutation: create a new task (with optional frequency) via POST /api/tasks */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: (data) =>
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<Task>(r)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Tarefa criada')
    },
    onError: (err) => toast.error(err.message || 'Erro ao criar tarefa'),
  })
}

/** Mutation: update an existing task (with optional frequency) via PUT /api/tasks/:id */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation<Task, Error, UpdateTaskPayload>({
    mutationFn: ({ id, ...data }) =>
      fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<Task>(r)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Tarefa atualizada')
    },
    onError: (err) => toast.error(err.message || 'Erro ao atualizar tarefa'),
  })
}

/** Mutation: delete a task via DELETE /api/tasks/:id */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) await handleResponse<void>(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Tarefa removida')
    },
    onError: (err) => toast.error(err.message || 'Erro ao remover tarefa'),
  })
}

// ---------------------------------------------------------------------------
// Task item (subtask) hooks
// ---------------------------------------------------------------------------

export type TaskItem = {
  id: string
  title: string
  note: string | null
  displayOrder: number
  active: boolean
  createdAt: string
}

export const TASK_ITEMS_QUERY_KEY = (taskId: string) => ['tasks', taskId, 'items'] as const

/** Fetches all task items for a given task (admin). */
export function useTaskItems(taskId: string | null | undefined) {
  return useQuery<TaskItem[]>({
    queryKey: TASK_ITEMS_QUERY_KEY(taskId ?? ''),
    queryFn: () => fetch(`/api/tasks/${taskId}/items`).then((r) => handleResponse<TaskItem[]>(r)),
    enabled: !!taskId,
  })
}

/** Mutation: create a new task item via POST /api/tasks/:taskId/items */
export function useCreateTaskItem() {
  const queryClient = useQueryClient()
  return useMutation<
    TaskItem,
    Error,
    { taskId: string; title: string; note?: string; displayOrder?: number }
  >({
    mutationFn: ({ taskId, ...data }) =>
      fetch(`/api/tasks/${taskId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<TaskItem>(r)),
    onSuccess: (_data, { taskId }) => {
      void queryClient.invalidateQueries({ queryKey: TASK_ITEMS_QUERY_KEY(taskId) })
    },
  })
}

/** Mutation: update a task item via PATCH /api/tasks/:taskId/items/:itemId */
export function useUpdateTaskItem() {
  const queryClient = useQueryClient()
  return useMutation<
    TaskItem,
    Error,
    {
      taskId: string
      itemId: string
      title?: string
      note?: string | null
      displayOrder?: number
      active?: boolean
    }
  >({
    mutationFn: ({ taskId, itemId, ...data }) =>
      fetch(`/api/tasks/${taskId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<TaskItem>(r)),
    onSuccess: (_data, { taskId }) => {
      void queryClient.invalidateQueries({ queryKey: TASK_ITEMS_QUERY_KEY(taskId) })
    },
  })
}

/** Mutation: delete a task item via DELETE /api/tasks/:taskId/items/:itemId */
export function useDeleteTaskItem() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { taskId: string; itemId: string }>({
    mutationFn: async ({ taskId, itemId }) => {
      const res = await fetch(`/api/tasks/${taskId}/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) await handleResponse<void>(res)
    },
    onSuccess: (_data, { taskId }) => {
      void queryClient.invalidateQueries({ queryKey: TASK_ITEMS_QUERY_KEY(taskId) })
    },
  })
}
