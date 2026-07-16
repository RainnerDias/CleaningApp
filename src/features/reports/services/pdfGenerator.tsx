import 'server-only'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Types (server-side: dates may be Date objects from Prisma)
// ---------------------------------------------------------------------------

export interface PdfReportRow {
  id: string
  date: Date | string
  status: string
  completedAt: Date | string | null
  task: {
    title: string
    estimatedMinutes: number
    room: { name: string }
  }
  user: { name: string }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function translateStatus(status: string): string {
  switch (status) {
    case 'completed':
      return 'Concluída'
    case 'skipped':
      return 'Ignorada'
    default:
      return 'Pendente'
  }
}

function safeFormat(value: Date | string | null, fmt: string): string {
  if (!value) return '—'
  try {
    return format(new Date(value), fmt, { locale: ptBR })
  } catch {
    return '—'
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#374151',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: '6 8',
    borderRadius: 2,
  },
  headerCell: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: '5 8',
    alignItems: 'center',
  },
  rowAlt: {
    backgroundColor: '#f8fafc',
  },
  cell: {
    fontSize: 8,
    color: '#374151',
  },
  // Column flex widths
  colDate: { flex: 1.2 },
  colTask: { flex: 3 },
  colRoom: { flex: 1.5 },
  colUser: { flex: 1.5 },
  colStatus: { flex: 1.1 },
  colTime: { flex: 0.9 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  summary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    padding: '10 12',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
})

// ---------------------------------------------------------------------------
// PDF Document component
// ---------------------------------------------------------------------------

interface ReportPDFProps {
  schedules: PdfReportRow[]
  filterSummary: string
  stats: {
    total: number
    completed: number
    pending: number
    skipped: number
    completionRate: number
  }
}

function ReportPDF({ schedules, filterSummary, stats }: ReportPDFProps) {
  return (
    <Document title="Relatório de Limpeza — Casa Limpa" author="Casa Limpa" creator="Casa Limpa">
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Casa Limpa — Relatório de Limpeza</Text>
          <Text style={styles.subtitle}>{filterSummary}</Text>
        </View>

        {/* Summary bar */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{stats.completed}</Text>
            <Text style={styles.summaryLabel}>Concluídas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#d97706' }]}>{stats.pending}</Text>
            <Text style={styles.summaryLabel}>Pendentes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#64748b' }]}>{stats.skipped}</Text>
            <Text style={styles.summaryLabel}>Ignoradas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#2563eb' }]}>{stats.completionRate}%</Text>
            <Text style={styles.summaryLabel}>Taxa de Conclusão</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colDate]}>Data</Text>
            <Text style={[styles.headerCell, styles.colTask]}>Tarefa</Text>
            <Text style={[styles.headerCell, styles.colRoom]}>Sala</Text>
            <Text style={[styles.headerCell, styles.colUser]}>Usuário</Text>
            <Text style={[styles.headerCell, styles.colStatus]}>Status</Text>
            <Text style={[styles.headerCell, styles.colTime]}>Est. (min)</Text>
          </View>

          {/* Data rows */}
          {schedules.map((s, i) => (
            <View key={s.id} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
              <Text style={[styles.cell, styles.colDate]}>{safeFormat(s.date, 'dd/MM/yyyy')}</Text>
              <Text style={[styles.cell, styles.colTask]}>{s.task.title}</Text>
              <Text style={[styles.cell, styles.colRoom]}>{s.task.room.name}</Text>
              <Text style={[styles.cell, styles.colUser]}>{s.user.name}</Text>
              <Text style={[styles.cell, styles.colStatus]}>{translateStatus(s.status)}</Text>
              <Text style={[styles.cell, styles.colTime]}>
                {s.task.estimatedMinutes > 0 ? String(s.task.estimatedMinutes) : '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages} — Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Renders the cleaning report as a PDF buffer.
 * Server-only — imported exclusively from API route handlers.
 */
export async function generateReportPDF(
  schedules: PdfReportRow[],
  filterSummary: string,
  stats: {
    total: number
    completed: number
    pending: number
    skipped: number
    completionRate: number
  }
): Promise<Buffer> {
  const element = <ReportPDF schedules={schedules} filterSummary={filterSummary} stats={stats} />
  const buffer = await renderToBuffer(element)
  return Buffer.from(buffer)
}
