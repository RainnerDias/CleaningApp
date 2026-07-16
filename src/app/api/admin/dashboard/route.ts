import { NextResponse } from 'next/server'
import { requireAdmin } from '@/features/auth/services/authService'
import { getDashboardData } from '@/features/dashboard/services/dashboardService'

/**
 * GET /api/admin/dashboard?period=30d|12m
 *
 * Returns all analytics metrics in a single response.
 * Admin access is required.
 */
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  try {
    const data = await getDashboardData()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/admin/dashboard]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' } },
      { status: 500 }
    )
  }
}
