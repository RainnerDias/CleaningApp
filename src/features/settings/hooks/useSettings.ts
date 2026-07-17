'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const settingKeys = {
  byKey: (key: string) => ['settings', key] as const,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SettingValue = { text: string }

interface SettingResponse {
  key: string
  value: SettingValue
}

// ---------------------------------------------------------------------------
// Shared response handler
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetches a setting by key via GET /api/settings/[key].
 * Accepts optional `initialData` from server-side prefetch for a fast first paint.
 */
export function useSettingQuery(key: string, initialData?: SettingResponse) {
  return useQuery<SettingResponse>({
    queryKey: settingKeys.byKey(key),
    queryFn: async () => {
      const res = await fetch(`/api/settings/${encodeURIComponent(key)}`)
      return handleResponse<SettingResponse>(res)
    },
    initialData,
    staleTime: 30_000,
  })
}

/**
 * Updates a setting value via PATCH /api/settings/[key].
 * Pushes the server response into the query cache on success so the UI
 * reflects the saved value without requiring an explicit refetch.
 */
export function useUpdateSetting(key: string) {
  const qc = useQueryClient()

  return useMutation<SettingResponse, Error, string>({
    mutationFn: async (value: string) => {
      const res = await fetch(`/api/settings/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      return handleResponse<SettingResponse>(res)
    },
    onSuccess: (data) => {
      qc.setQueryData(settingKeys.byKey(key), data)
    },
  })
}
