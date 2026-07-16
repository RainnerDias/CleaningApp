'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types'

export const CATEGORIES_QUERY_KEY = ['categories'] as const

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

/** Fetches all categories. Accepts optional server-fetched data as initial value. */
export function useCategories(initialData?: Category[]) {
  return useQuery<Category[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => fetch('/api/categories').then((r) => handleResponse<Category[]>(r)),
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
  })
}

/** Mutation: create a new category via POST /api/categories */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, Error, CreateCategoryInput>({
    mutationFn: (data) =>
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<Category>(r)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })
}

/** Mutation: update an existing category via PUT /api/categories/:id */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, Error, { id: string } & UpdateCategoryInput>({
    mutationFn: ({ id, ...data }) =>
      fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<Category>(r)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })
}

/** Mutation: delete a category via DELETE /api/categories/:id */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) await handleResponse<void>(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    },
  })
}
