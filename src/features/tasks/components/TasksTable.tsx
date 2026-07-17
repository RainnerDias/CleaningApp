'use client'

import { useState } from 'react'
import { Pencil, Trash2, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton'
import type { Task, Frequency } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const FREQUENCY_TYPE_LABELS: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  custom: 'Personalizada',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

function formatFrequency(freq: Frequency | null): string {
  if (!freq) return '—'

  const label = FREQUENCY_TYPE_LABELS[freq.type] ?? freq.type

  if (
    (freq.type === 'weekly' || freq.type === 'biweekly' || freq.type === 'custom') &&
    freq.daysOfWeek.length > 0
  ) {
    const days = [...freq.daysOfWeek]
      .sort((a, b) => a - b)
      .map((d) => DAY_LABELS_PT[d] ?? d)
      .join(', ')
    return `${label} — ${days}`
  }

  if (freq.type === 'monthly') {
    if (freq.weekOfMonth) return `${label} — Semana ${freq.weekOfMonth}`
    if (freq.dayOfMonth) return `${label} — Dia ${freq.dayOfMonth}`
  }

  return label
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TasksTableProps {
  tasks: Task[]
  isLoading?: boolean
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Data table for listing tasks with search/filter, priority badge,
 * frequency summary, estimated time, status, and action buttons.
 */
export function TasksTable({ tasks, isLoading = false, onEdit, onDelete }: TasksTableProps) {
  const [search, setSearch] = useState('')
  const [roomFilter, setRoomFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  if (isLoading) {
    return <DataTableSkeleton rows={5} columns={7} />
  }

  // Build unique room list for the filter
  const roomOptions = Array.from(new Map(tasks.map((t) => [t.roomId, t.room])).values()).sort(
    (a, b) => a.name.localeCompare(b.name)
  )

  const filtered = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.room.name.toLowerCase().includes(search.toLowerCase())
    const matchesRoom = roomFilter === 'all' || t.roomId === roomFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && t.active) ||
      (statusFilter === 'inactive' && !t.active)
    return matchesSearch && matchesRoom && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Buscar tarefa ou sala..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Buscar tarefa por título ou sala"
        />

        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Filtrar por sala"
        >
          <option value="all">Todas as salas</option>
          {roomOptions.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Inativas</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Sala</th>
              <th className="px-4 py-3 font-medium">Tarefa</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Prioridade</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Frequência</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Tempo</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                      <ClipboardList className="size-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {search || roomFilter !== 'all' || statusFilter !== 'all'
                        ? 'Nenhuma tarefa encontrada para os filtros aplicados.'
                        : 'Nenhuma tarefa cadastrada ainda.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((task, index) => (
                <tr
                  key={task.id}
                  className={
                    index < filtered.length - 1
                      ? 'border-b border-border hover:bg-muted/40 transition-colors'
                      : 'hover:bg-muted/40 transition-colors'
                  }
                >
                  {/* Room pill */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: task.room.color }}
                    >
                      <span aria-hidden="true">{task.room.icon}</span>
                      {task.room.name}
                    </span>
                  </td>

                  {/* Task title */}
                  <td className="px-4 py-3">
                    <span className="font-medium">{task.title}</span>
                    {task.category && (
                      <span
                        className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: task.category.color }}
                      >
                        {task.category.name}
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge
                      variant={
                        task.priority === 'high'
                          ? 'destructive'
                          : task.priority === 'low'
                            ? 'secondary'
                            : 'default'
                      }
                    >
                      {PRIORITY_LABELS[task.priority] ?? task.priority}
                    </Badge>
                  </td>

                  {/* Frequency */}
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {formatFrequency(task.frequency)}
                  </td>

                  {/* Estimated time */}
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {task.estimatedMinutes} min
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={task.active ? 'success' : 'secondary'}>
                      {task.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(task)}
                        aria-label={`Editar tarefa ${task.title}`}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDelete(task)}
                        aria-label={`Excluir tarefa ${task.title}`}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'tarefa' : 'tarefas'} encontrada
          {filtered.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
