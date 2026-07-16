'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    },
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
    },
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
    },
  })
}
