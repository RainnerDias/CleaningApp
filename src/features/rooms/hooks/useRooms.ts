'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Room, CreateRoomInput, UpdateRoomInput } from '../types'

export const ROOMS_QUERY_KEY = ['rooms'] as const

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

/** Fetches all rooms. Accepts optional server-fetched data as initial value. */
export function useRooms(initialData?: Room[]) {
  return useQuery<Room[]>({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: () => fetch('/api/rooms').then((r) => handleResponse<Room[]>(r)),
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
  })
}

/** Mutation: create a new room via POST /api/rooms */
export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation<Room, Error, CreateRoomInput>({
    mutationFn: (data) =>
      fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<Room>(r)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}

/** Mutation: update an existing room via PUT /api/rooms/:id */
export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation<Room, Error, { id: string } & UpdateRoomInput>({
    mutationFn: ({ id, ...data }) =>
      fetch(`/api/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<Room>(r)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}

/** Mutation: delete a room via DELETE /api/rooms/:id */
export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
      if (!res.ok) await handleResponse<void>(res)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}
