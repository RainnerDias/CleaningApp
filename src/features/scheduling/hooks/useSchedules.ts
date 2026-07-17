'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { toast } from 'sonner'
import type { ScheduleWithDetails } from '../types'

export const scheduleKeys = {
  all: ['schedules'] as const,
  byRange: (from: string, to: string) => ['schedules', 'range', from, to] as const,
  byDate: (date: string) => ['schedules', 'date', date] as const,
  filtered: (from: string, to: string, status?: string, roomId?: string) =>
    ['schedules', 'filtered', from, to, status ?? null, roomId ?? null] as const,
}

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

/**
 * Fetches all schedules for the given date range.
 * Automatically refetches when the range changes (e.g. month navigation).
 */
export function useSchedulesByRange(from: Date, to: Date) {
  const fromStr = format(from, 'yyyy-MM-dd')
  const toStr = format(to, 'yyyy-MM-dd')

  return useQuery<ScheduleWithDetails[]>({
    queryKey: scheduleKeys.byRange(fromStr, toStr),
    queryFn: async () => {
      const params = new URLSearchParams({ from: fromStr, to: toStr })
      const res = await fetch(`/api/schedules?${params.toString()}`)
      return handleResponse<ScheduleWithDetails[]>(res)
    },
    staleTime: 60_000,
  })
}

/**
 * Triggers server-side schedule generation for an optional date range.
 * Invalidates all schedule queries on success.
 */
export function useGenerateSchedules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { from?: string; to?: string }) => {
      const res = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error('Generation failed')
      return res.json() as Promise<{ generated: number; skipped: number }>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  })
}

/**
 * Updates the status of a schedule (pending | completed | skipped).
 * Admins may update any schedule; users may only update their own.
 */
export function useUpdateScheduleStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'completed' | 'skipped'
    }) => {
      const res = await fetch(`/api/schedules/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      return handleResponse<ScheduleWithDetails>(res)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
    onError: (err) => toast.error(err.message || 'Erro ao atualizar status'),
  })
}

/**
 * Reassigns a schedule to a different user (admin only).
 * Calls PUT /api/schedules/:id with { assignedTo: userId }.
 */
export function useReassignSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, assignedTo }: { id: string; assignedTo: string }) => {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo }),
      })
      return handleResponse<ScheduleWithDetails>(res)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  })
}

// ---------------------------------------------------------------------------
// User-facing today page hooks
// ---------------------------------------------------------------------------

type CommentResponse = {
  id: string
  comment: string
  createdAt: string
  user: { id: string; name: string }
}

type PhotoResponse = { id: string; imageUrl: string }

/**
 * Fetches today's schedules for the authenticated user.
 * Uses server-fetched data as the initial value to avoid a loading flash.
 * Auto-refreshes every 60 seconds so status changes from other sessions appear.
 */
export function useTodaySchedules(initialData: ScheduleWithDetails[]) {
  return useQuery<ScheduleWithDetails[]>({
    queryKey: scheduleKeys.byDate(format(new Date(), 'yyyy-MM-dd')),
    queryFn: () =>
      fetch('/api/schedules/today').then((r) => handleResponse<ScheduleWithDetails[]>(r)),
    initialData,
    initialDataUpdatedAt: 0, // treat server data as immediately stale → refetch in background
    staleTime: 30_000, // 30 s — today's data changes frequently
    refetchInterval: 60_000, // auto-refresh every minute
  })
}

/**
 * Adds a text comment to a schedule entry.
 * Invalidates all schedule queries on success.
 */
export function useAddComment() {
  const qc = useQueryClient()
  return useMutation<CommentResponse, Error, { scheduleId: string; comment: string }>({
    mutationFn: ({ scheduleId, comment }) =>
      fetch(`/api/schedules/${scheduleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      }).then((r) => handleResponse<CommentResponse>(r)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all })
      toast.success('Comentário salvo')
    },
    onError: (err) => toast.error(err.message || 'Erro ao salvar comentário'),
  })
}

/**
 * Uploads a photo for a schedule entry via FormData.
 * Invalidates all schedule queries on success.
 */
export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation<PhotoResponse, Error, { scheduleId: string; file: File }>({
    mutationFn: ({ scheduleId, file }) => {
      const form = new FormData()
      form.append('file', file)
      return fetch(`/api/schedules/${scheduleId}/photos`, {
        method: 'POST',
        body: form,
      }).then((r) => handleResponse<PhotoResponse>(r))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  })
}

/**
 * Deletes a photo by ID (removes from Supabase Storage and the database).
 * Invalidates all schedule queries on success.
 */
export function useDeletePhoto() {
  const qc = useQueryClient()
  return useMutation<void, Error, { scheduleId: string; photoId: string }>({
    mutationFn: async ({ scheduleId, photoId }) => {
      const res = await fetch(`/api/schedules/${scheduleId}/photos/${photoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) await handleResponse<void>(res) // throws with error message
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  })
}

/**
 * Fetches schedules for a given week (Mon–Sun).
 * Only injects `initialData` when provided — callers are responsible for
 * passing it only when the query key matches the server-fetched range.
 * Uses `placeholderData` (keeps previous data) during week navigation.
 */
export function useSchedulesByWeek(weekStart: Date, initialData?: ScheduleWithDetails[]) {
  const fromStr = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const toStr = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  return useQuery<ScheduleWithDetails[]>({
    queryKey: scheduleKeys.byRange(fromStr, toStr),
    queryFn: async () => {
      const params = new URLSearchParams({ from: fromStr, to: toStr })
      const res = await fetch(`/api/schedules?${params.toString()}`)
      return handleResponse<ScheduleWithDetails[]>(res)
    },
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  })
}

/**
 * Fetches schedules for the history page with optional status and room filters.
 * Only injects `initialData` when provided — callers pass it only for the
 * default filter state (matching what the server pre-fetched).
 */
export function useScheduleHistory(
  params: { from: Date; to: Date; status?: string; roomId?: string },
  initialData?: ScheduleWithDetails[]
) {
  const fromStr = format(params.from, 'yyyy-MM-dd')
  const toStr = format(params.to, 'yyyy-MM-dd')

  return useQuery<ScheduleWithDetails[]>({
    queryKey: scheduleKeys.filtered(fromStr, toStr, params.status, params.roomId),
    queryFn: async () => {
      const searchParams = new URLSearchParams({ from: fromStr, to: toStr })
      if (params.status) searchParams.set('status', params.status)
      if (params.roomId) searchParams.set('roomId', params.roomId)
      const res = await fetch(`/api/schedules?${searchParams.toString()}`)
      return handleResponse<ScheduleWithDetails[]>(res)
    },
    initialData,
    initialDataUpdatedAt: initialData ? 0 : undefined,
    staleTime: 60_000,
  })
}

/**
 * Records a clock-in timestamp for a schedule.
 * Invalidates all schedule queries on success.
 */
export function useClockIn() {
  const qc = useQueryClient()
  return useMutation<void, Error, { scheduleId: string }>({
    mutationFn: async ({ scheduleId }) => {
      const res = await fetch(`/api/schedules/${scheduleId}/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'in' }),
      })
      await handleResponse<unknown>(res)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all })
      toast.success('Cronômetro iniciado')
    },
    onError: (err) => toast.error(err.message || 'Erro ao iniciar cronômetro'),
  })
}

/**
 * Records a clock-out timestamp for a schedule.
 * Invalidates all schedule queries on success.
 */
export function useClockOut() {
  const qc = useQueryClient()
  return useMutation<void, Error, { scheduleId: string }>({
    mutationFn: async ({ scheduleId }) => {
      const res = await fetch(`/api/schedules/${scheduleId}/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'out' }),
      })
      await handleResponse<unknown>(res)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all })
      toast.success('Cronômetro parado')
    },
    onError: (err) => toast.error(err.message || 'Erro ao parar cronômetro'),
  })
}

/**
 * Toggles the completion state of a single subtask within a schedule.
 * POSTs to /api/schedules/:scheduleId/items/:taskItemId/toggle.
 * On success, invalidates all schedule queries so the UI reflects the new state.
 */
export function useToggleItemCompletion() {
  const qc = useQueryClient()
  return useMutation<
    { completionId: string; completedAt: string | null; scheduleStatus: string },
    Error,
    { scheduleId: string; taskItemId: string }
  >({
    mutationFn: ({ scheduleId, taskItemId }) =>
      fetch(`/api/schedules/${scheduleId}/items/${taskItemId}/toggle`, {
        method: 'POST',
      }).then((r) =>
        handleResponse<{
          completionId: string
          completedAt: string | null
          scheduleStatus: string
        }>(r)
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  })
}
