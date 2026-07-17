import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ExcelJS from 'exceljs'
import type { Prisma } from '@prisma/client'
import { requireAdmin } from '@/features/auth/services/authService'
import { prisma } from '@/lib/prisma'
import type { ScheduleStatus } from '@prisma/client'
import { generateReportPDF } from '@/features/reports/services/pdfGenerator'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_STATUSES: ScheduleStatus[] = ['pending', 'completed', 'skipped']
const VALID_FORMATS = ['xlsx', 'pdf'] as const
type ExportFormat = (typeof VALID_FORMATS)[number]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduleExportRow {
  id: string
  date: Date
  status: string
  completedAt: Date | null
  task: {
    id: string
    title: string
    estimatedMinutes: number
    room: { id: string; name: string }
  }
  user: { id: string; name: string }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function translateStatus(status: string): string {
  switch (status) {
    case 'completed':
      return 'ConcluÃ­da'
    case 'skipped':
      return 'Ignorada'
    default:
      return 'Pendente'
  }
}

async function fetchAllForExport(where: Prisma.ScheduleWhereInput): Promise<ScheduleExportRow[]> {
  return prisma.schedule.findMany({
    where,
    select: {
      id: true,
      date: true,
      status: true,
      completedAt: true,
      task: {
        select: {
          id: true,
          title: true,
          estimatedMinutes: true,
          room: { select: { id: true, name: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'asc' }, { task: { room: { displayOrder: 'asc' } } }],
  }) as Promise<ScheduleExportRow[]>
}

// ---------------------------------------------------------------------------
// Excel generator
// ---------------------------------------------------------------------------

async function generateExcel(schedules: ScheduleExportRow[]): Promise<Uint8Array<ArrayBuffer>> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Casa Limpa'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('RelatÃ³rio de Limpeza')

  sheet.columns = [
    { header: 'Data', key: 'date', width: 15 },
    { header: 'Tarefa', key: 'task', width: 35 },
    { header: 'Sala', key: 'room', width: 20 },
    { header: 'UsuÃ¡rio', key: 'user', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Tempo Estimado (min)', key: 'estimated', width: 22 },
    { header: 'ConcluÃ­do em', key: 'completedAt', width: 20 },
  ]

  // Style header row
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  }
  sheet.getRow(1).alignment = { vertical: 'middle' }

  // Add data rows
  schedules.forEach((s) => {
    sheet.addRow({
      date: format(new Date(s.date), 'dd/MM/yyyy', { locale: ptBR }),
      task: s.task.title,
      room: s.task.room.name,
      user: s.user.name,
      status: translateStatus(s.status),
      estimated: s.task.estimatedMinutes,
      completedAt: s.completedAt
        ? format(new Date(s.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
        : 'â€”',
    })
  })

  // Zebra striping for readability
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle' }
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        }
      }
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  // Uint8Array.from produces Uint8Array<ArrayBuffer>, which satisfies DOM's BufferSource / BodyInit
  return Uint8Array.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/reports/export
 *
 * Query params:
 *   format     xlsx | pdf (required)
 *   from       ISO date string (required)
 *   to         ISO date string (required)
 *   roomId     UUID (optional)
 *   userId     UUID (optional)
 *   status     pending | completed | skipped (optional)
 *
 * Streams a file download containing ALL matching records (no pagination).
 */
export async function GET(request: NextRequest) {
  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
      { status: 401 }
    )
  }

  // â”€â”€ Parse params â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { searchParams } = request.nextUrl

  const formatParam = searchParams.get('format')
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const roomId = searchParams.get('roomId') || undefined
  const userId = searchParams.get('userId') || undefined
  const statusParam = searchParams.get('status') || undefined

  if (!formatParam || !VALID_FORMATS.includes(formatParam as ExportFormat)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '`format` must be xlsx or pdf' } },
      { status: 422 }
    )
  }

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: '`from` and `to` are required' } },
      { status: 422 }
    )
  }

  let fromDate: Date
  let toDate: Date
  try {
    fromDate = startOfDay(parseISO(fromStr))
    toDate = endOfDay(parseISO(toStr))
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: '`from` and `to` must be valid ISO date strings',
        },
      },
      { status: 422 }
    )
  }

  const status =
    statusParam && VALID_STATUSES.includes(statusParam as ScheduleStatus)
      ? (statusParam as ScheduleStatus)
      : undefined

  const where: Prisma.ScheduleWhereInput = {
    date: { gte: fromDate, lte: toDate },
    ...(userId ? { assignedTo: userId } : {}),
    ...(status ? { status } : {}),
    ...(roomId ? { task: { roomId } } : {}),
  }

  // â”€â”€ Fetch and export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    const [schedules, statusCounts] = await Promise.all([
      fetchAllForExport(where),
      prisma.schedule.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ])

    const byStatus = statusCounts.reduce(
      (acc, row) => ({ ...acc, [row.status]: row._count.status }),
      {} as Record<string, number>
    )

    const total = schedules.length
    const completed = byStatus['completed'] ?? 0
    const pending = byStatus['pending'] ?? 0
    const skipped = byStatus['skipped'] ?? 0
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const stats = { total, completed, pending, skipped, completionRate }
    const dateStr = format(new Date(), 'yyyy-MM-dd')
    const filterSummary = `PerÃ­odo: ${format(fromDate, 'dd/MM/yyyy', { locale: ptBR })} atÃ© ${format(toDate, 'dd/MM/yyyy', { locale: ptBR })} â€” ${total} registro${total !== 1 ? 's' : ''}`

    if (formatParam === 'xlsx') {
      // generateExcel returns Uint8Array<ArrayBuffer>, valid BodyInit
      const bytes = await generateExcel(schedules)
      return new Response(bytes, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="relatorio-limpeza-${dateStr}.xlsx"`,
        },
      })
    }

    // PDF â€” Uint8Array.from converts Node.js Buffer to Uint8Array<ArrayBuffer>
    const pdfBuffer = await generateReportPDF(schedules, filterSummary, stats)
    return new Response(Uint8Array.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-limpeza-${dateStr}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/reports/export]', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate export' } },
      { status: 500 }
    )
  }
}
