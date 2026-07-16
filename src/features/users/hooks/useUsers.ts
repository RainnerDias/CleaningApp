'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AppUser, InviteUserInput, UpdateUserInput } from '../types'

export const USERS_QUERY_KEY = ['users'] as const

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

/** Fetches all users. Accepts optional server-fetched data as initial value. */
export function useUsers(initialData?: AppUser[]) {
  return useQuery<AppUser[]>({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => fetch('/api/users').then((r) => handleResponse<AppUser[]>(r)),
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
  })
}

/** Mutation: invite a new user via POST /api/users */
export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation<AppUser, Error, InviteUserInput>({
    mutationFn: (data) =>
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<AppUser>(r)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}

/** Mutation: update an existing user via PUT /api/users/:id */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation<AppUser, Error, { id: string } & UpdateUserInput>({
    mutationFn: ({ id, ...data }) =>
      fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<AppUser>(r)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}
