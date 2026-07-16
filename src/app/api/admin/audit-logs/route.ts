import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { requireAdmin } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/audit-logs
 *
 * Query params:
 *   search       string — searches action, entityType, and entityId (optional)
 *   entityType   string — exact match (optional)
 *   action       string — exact match (optional)
 *   from         ISO date string (optional)
 *   to           ISO date string (optional)
 *   page         integer >= 1 (default: 1)
 *   limit        integer 1–100 (default: 50)
 *
 * Returns paginated audit log entries with the associated user.
 */
export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  // ── Parse params ────────────────────────────────────────────────────────
  const { searchParams } = request.nextUrl

  const search = searchParams.get('search') || undefined
  const entityType = searchParams.get('entityType') || undefined
  const action = searchParams.get('action') || undefined
  const fromStr = searchParams.get('from') || undefined
  const toStr = searchParams.get('to') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))

  // ── Build where clause ──────────────────────────────────────────────────
  type StringFilter = { contains: string; mode: 'insensitive' }
  type WhereClause = {
    OR?: Array<{ action?: StringFilter; entityType?: StringFilter; entityId?: StringFilter }>
    entityType?: string
    action?: string
    createdAt?: { gte?: Date; lte?: Date }
  }

  const where: WhereClause = {}

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { entityType: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (entityType) {
    where.entityType = entityType
  }

  if (action) {
    where.action = action
  }

  if (fromStr || toStr) {
    where.createdAt = {}
    if (fromStr) {
      try {
        where.createdAt.gte = startOfDay(parseISO(fromStr))
      } catch {
        /* ignore invalid dates */
      }
    }
    if (toStr) {
      try {
        where.createdAt.lte = endOfDay(parseISO(toStr))
      } catch {
        /* ignore invalid dates */
      }
    }
  }

  // ── Query ────────────────────────────────────────────────────────────────
  try {
    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          oldValue: true,
          newValue: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (err) {
    console.error('[GET /api/admin/audit-logs]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit logs' } },
      { status: 500 }
    )
  }
}
