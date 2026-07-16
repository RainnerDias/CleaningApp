'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { DashboardData } from '../types'

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const

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
 * Fetches and caches the admin dashboard analytics data.
 *
 * @param period - Currently unused at the API level but kept for future filtering.
 * @param initialData - Server-fetched data for instant first paint (passed from the server page).
 */
export function useDashboard(period: '30d' | '12m' = '30d', initialData?: DashboardData) {
  return useQuery<DashboardData>({
    queryKey: [...DASHBOARD_QUERY_KEY, period],
    queryFn: () =>
      fetch(`/api/admin/dashboard?period=${period}`).then((r) => handleResponse<DashboardData>(r)),
    initialData,
    // Setting to 0 marks initial data as immediately stale so a background
    // refetch runs on mount, keeping the view fresh without blocking render.
    initialDataUpdatedAt: initialData ? 0 : undefined,
    staleTime: 5 * 60_000,
  })
}

/**
 * Returns a callback that invalidates the dashboard query, triggering a refetch.
 */
export function useDashboardRefresh(period: '30d' | '12m' = '30d') {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_QUERY_KEY, period] })
  }
}
