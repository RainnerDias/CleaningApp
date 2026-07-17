'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  Camera,
  MessageSquare,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  PartyPopper,
  Timer,
  Pin,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ScheduleWithDetails, TaskItemWithCompletion } from '../types'
import {
  useTodaySchedules,
  useUpdateScheduleStatus,
  useAddComment,
  useUploadPhoto,
  useDeletePhoto,
  useClockIn,
  useClockOut,
  useToggleItemCompletion,
} from '../hooks/useSchedules'

// ---------------------------------------------------------------------------
// Constants & utilities
// ---------------------------------------------------------------------------

const WEEKDAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

function formatDatePt(date: Date): string {
  return `Hoje é ${WEEKDAYS_PT[date.getDay()]}, ${date.getDate()} de ${MONTHS_PT[date.getMonth()]}`
}

type ScheduleStatus = ScheduleWithDetails['status']

type RoomGroup = {
  room: ScheduleWithDetails['task']['room']
  schedules: ScheduleWithDetails[]
}

function groupByRoom(schedules: ScheduleWithDetails[]): RoomGroup[] {
  const map = new Map<string, RoomGroup>()
  for (const schedule of schedules) {
    const { room } = schedule.task
    if (!map.has(room.id)) {
      map.set(room.id, { room, schedules: [] })
    }
    map.get(room.id)!.schedules.push(schedule)
  }
  return Array.from(map.values())
}

function getPriorityDotClass(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-amber-400'
    default:
      return 'bg-gray-300 dark:bg-gray-600'
  }
}

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return 'Alta prioridade'
    case 'medium':
      return 'Média prioridade'
    default:
      return 'Baixa prioridade'
  }
}

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const checkmarkVariants: Variants = {
  unchecked: { pathLength: 0, opacity: 0 },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TodayClientProps {
  /** Current authenticated user */
  user: { id: string; name: string }
  /** Server-fetched schedules used as React Query initial data */
  initialSchedules: ScheduleWithDetails[]
  /** Text of the golden rule from admin settings */
  goldenRule: string
  /** Pre-formatted date label computed server-side (avoids timezone hydration mismatch) */
  todayLabel: string
  /** ISO date string representing the server's "today" reference point */
  today: string
}

// ---------------------------------------------------------------------------
// GoldenRuleBanner
// ---------------------------------------------------------------------------

interface GoldenRuleBannerProps {
  text: string
}

/**
 * Permanent banner that displays the golden rule.
 * It is always visible when there is text — it cannot be dismissed.
 */
function GoldenRuleBanner({ text }: GoldenRuleBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      role="note"
      aria-label="Regra de Ouro"
      className="mx-4 mb-4 rounded-xl border-l-4 border-amber-400 border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/20"
    >
      <div className="flex items-start gap-2 min-w-0">
        <Pin
          className="mt-0.5 size-4 shrink-0 rotate-45 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Regra de Ouro
          </p>
          <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Checklist helper
// ---------------------------------------------------------------------------

/**
 * Joins task.items with schedule.itemCompletions to produce a flat list
 * of items with their completion state for the current schedule instance.
 */
function deriveChecklist(schedule: ScheduleWithDetails): TaskItemWithCompletion[] {
  return schedule.task.items.map((item) => {
    const comp = schedule.itemCompletions.find((c) => c.taskItemId === item.id)
    return {
      id: item.id,
      title: item.title,
      note: item.note,
      displayOrder: item.displayOrder,
      completedAt: comp?.completedAt ?? null,
      completionId: comp?.id ?? null,
    }
  })
}

// ---------------------------------------------------------------------------
// TaskCard
// ---------------------------------------------------------------------------

interface TaskCardProps {
  schedule: ScheduleWithDetails
  effectiveStatus: ScheduleStatus
  onToggle: () => void
  onSkip: () => void
}

function TaskCard({ schedule, effectiveStatus, onToggle, onSkip }: TaskCardProps) {
  const { task } = schedule

  // ── Local UI state ──────────────────────────────────────────────────────
  const [isCommentExpanded, setIsCommentExpanded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSkipConfirming, setIsSkipConfirming] = useState(false)

  type PendingUpload = {
    key: string
    previewUrl: string
    status: 'uploading' | 'error'
    errorMsg?: string
  }
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Mutations ───────────────────────────────────────────────────────────
  const addComment = useAddComment()
  const uploadPhoto = useUploadPhoto()
  const deletePhoto = useDeletePhoto()
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const toggleItem = useToggleItemCompletion()

  // ── Derived state ───────────────────────────────────────────────────────
  const checklist = deriveChecklist(schedule)
  const hasChecklist = checklist.length > 0
  // When there's a checklist, the main checkbox is driven by all items being done
  const allItemsDone = hasChecklist && checklist.every((item) => item.completedAt !== null)
  const completedItemCount = checklist.filter((item) => item.completedAt !== null).length

  const isCompleted = hasChecklist ? allItemsDone : effectiveStatus === 'completed'
  const isSkipped = effectiveStatus === 'skipped'
  const isCollapsed = isSkipped

  const isClockedIn = Boolean(schedule.startedAt) && !schedule.stoppedAt
  const isClockedOut = Boolean(schedule.startedAt) && Boolean(schedule.stoppedAt)

  function formatDuration(startedAt: string | null, stoppedAt: string | null): string | null {
    if (!startedAt) return null
    const end = stoppedAt ? new Date(stoppedAt) : null
    if (!end) return null
    const mins = Math.round((end.getTime() - new Date(startedAt).getTime()) / 60_000)
    return `${mins} min real`
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleCommentSave() {
    const trimmed = commentText.trim()
    if (!trimmed) return
    addComment.mutate(
      { scheduleId: schedule.id, comment: trimmed },
      {
        onSuccess: () => setCommentText(''),
      }
    )
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-selected later
    e.target.value = ''

    const previewUrl = URL.createObjectURL(file)
    const key = `${Date.now()}-${file.name}`

    setPendingUploads((prev) => [...prev, { key, previewUrl, status: 'uploading' }])

    uploadPhoto.mutate(
      { scheduleId: schedule.id, file },
      {
        onSuccess: () => {
          URL.revokeObjectURL(previewUrl)
          setPendingUploads((prev) => prev.filter((u) => u.key !== key))
        },
        onError: (err) => {
          setPendingUploads((prev) =>
            prev.map((u) => (u.key === key ? { ...u, status: 'error', errorMsg: err.message } : u))
          )
        },
      }
    )
  }

  function handleDeletePhoto(photoId: string) {
    deletePhoto.mutate({ scheduleId: schedule.id, photoId })
  }

  function handleSkipConfirm() {
    setIsSkipConfirming(false)
    onSkip()
  }

  // Cleanup orphaned object URLs on unmount
  useEffect(() => {
    return () => {
      pendingUploads.forEach((u) => URL.revokeObjectURL(u.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Collapsed (skipped) view ─────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-3 flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3"
      >
        <span className="text-sm text-muted-foreground line-through">{task.title}</span>
        <Badge variant="secondary">Ignorada</Badge>
      </motion.div>
    )
  }

  // ── Full card view ───────────────────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: isCompleted ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'mb-3 rounded-xl border border-border bg-card p-4 shadow-sm',
        isCompleted && 'bg-muted/30'
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-start gap-3">
        {/* Circular checkbox */}
        <button
          type="button"
          onClick={hasChecklist ? undefined : onToggle}
          disabled={hasChecklist}
          aria-label={
            hasChecklist
              ? `${task.title} — ${completedItemCount} de ${checklist.length} subtarefas concluídas`
              : isCompleted
                ? `Marcar "${task.title}" como pendente`
                : `Marcar "${task.title}" como concluída`
          }
          aria-pressed={isCompleted}
          className={cn(
            'mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full',
            hasChecklist && 'cursor-default opacity-70'
          )}
        >
          <motion.div
            className="size-6 rounded-full border-2 flex items-center justify-center"
            animate={{
              backgroundColor: isCompleted ? '#22c55e' : 'transparent',
              borderColor: isCompleted ? '#22c55e' : '#9ca3af',
              scale: isCompleted ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
              <motion.path
                d="M5 13l4 4L19 7"
                variants={checkmarkVariants}
                animate={isCompleted ? 'checked' : 'unchecked'}
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium leading-snug',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </p>
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 shrink-0">
          {task.estimatedMinutes > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              ⏱ {task.estimatedMinutes} min
            </span>
          )}
          <span
            className={cn('size-2.5 rounded-full shrink-0', getPriorityDotClass(task.priority))}
            aria-label={getPriorityLabel(task.priority)}
            role="img"
          />
        </div>
      </div>

      {/* ── Pill row ── */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-9">
        {/* Room pill */}
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${task.room.color}18`,
            borderColor: `${task.room.color}40`,
            color: task.room.color,
          }}
        >
          <span aria-hidden="true">{task.room.icon}</span>
          {task.room.name}
        </span>

        {/* Category pill */}
        {task.category && (
          <span
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${task.category.color}18`,
              borderColor: `${task.category.color}40`,
              color: task.category.color,
            }}
          >
            {task.category.name}
          </span>
        )}
      </div>

      {/* ── Checklist ── */}
      {hasChecklist && (
        <div className="mt-3 pl-9">
          <p className="text-xs text-muted-foreground mb-2">
            {completedItemCount} de {checklist.length}{' '}
            {checklist.length === 1 ? 'concluída' : 'concluídas'}
          </p>
          <ul className="space-y-1.5" aria-label={`Subtarefas de ${task.title}`}>
            {checklist.map((item) => {
              const isDone = item.completedAt !== null
              return (
                <li key={item.id} className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      toggleItem.mutate({ scheduleId: schedule.id, taskItemId: item.id })
                    }
                    disabled={toggleItem.isPending}
                    aria-label={
                      isDone ? `Desmarcar "${item.title}"` : `Marcar "${item.title}" como concluída`
                    }
                    aria-pressed={isDone}
                    className="mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-full"
                  >
                    <motion.div
                      className="size-4 rounded-full border-2 flex items-center justify-center"
                      animate={{
                        backgroundColor: isDone ? '#22c55e' : 'transparent',
                        borderColor: isDone ? '#22c55e' : '#9ca3af',
                      }}
                      transition={{ duration: 0.15 }}
                    >
                      <svg viewBox="0 0 24 24" className="size-2.5" fill="none" aria-hidden="true">
                        <motion.path
                          d="M5 13l4 4L19 7"
                          variants={checkmarkVariants}
                          animate={isDone ? 'checked' : 'unchecked'}
                          stroke="white"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-xs leading-snug',
                        isDone && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.title}
                    </p>
                    {item.note && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {item.note}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {toggleItem.isError && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {toggleItem.error.message}
            </p>
          )}
        </div>
      )}

      {/* ── Comment section ── */}
      <div className="mt-3 pl-9">
        <button
          type="button"
          onClick={() => setIsCommentExpanded((v) => !v)}
          aria-expanded={isCommentExpanded}
          aria-controls={`comment-${schedule.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <MessageSquare className="size-3.5" aria-hidden="true" />
          Comentário
          {schedule.comments.length > 0 && (
            <span className="ml-0.5 font-medium text-primary">({schedule.comments.length})</span>
          )}
          {isCommentExpanded ? (
            <ChevronUp className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          )}
        </button>

        <AnimatePresence>
          {isCommentExpanded && (
            <motion.div
              id={`comment-${schedule.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2">
                {/* Existing comments */}
                {schedule.comments.length > 0 && (
                  <ul className="space-y-1.5" aria-label="Comentários existentes">
                    {schedule.comments.map((c) => (
                      <li key={c.id} className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                        <span className="font-medium">{c.user.name}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {format(new Date(c.createdAt), 'dd/MM HH:mm')}
                        </span>
                        <p className="mt-0.5 text-foreground/80">{c.comment}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {/* New comment input */}
                <div className="space-y-1.5">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Escreva um comentário..."
                    aria-label="Novo comentário"
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{commentText.length}/2000</span>
                    <Button
                      size="sm"
                      onClick={handleCommentSave}
                      disabled={!commentText.trim() || addComment.isPending}
                      aria-busy={addComment.isPending}
                    >
                      {addComment.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : null}
                      Salvar
                    </Button>
                  </div>
                  {addComment.isError && (
                    <p role="alert" className="text-xs text-destructive">
                      {addComment.error.message}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Photo section ── */}
      <div className="mt-3 pl-9">
        <div className="flex items-center gap-1.5 mb-2">
          <Camera className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Fotos</span>
        </div>

        {/* Photo grid */}
        {(schedule.photos.length > 0 || pendingUploads.length > 0) && (
          <div className="grid grid-cols-3 gap-2 mb-2" role="list" aria-label="Fotos anexadas">
            {/* Uploaded photos */}
            {schedule.photos.map((photo, i) => (
              <div
                key={photo.id}
                role="listitem"
                className="relative aspect-square group rounded-md overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  aria-label={`Excluir foto ${i + 1}`}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X className="size-3 text-white" aria-hidden="true" />
                </button>
              </div>
            ))}

            {/* Pending upload previews */}
            {pendingUploads.map((upload) => (
              <div
                key={upload.key}
                role="listitem"
                aria-label={
                  upload.status === 'uploading' ? 'Enviando foto...' : 'Erro ao enviar foto'
                }
                className="relative aspect-square rounded-md overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upload.previewUrl}
                  alt=""
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                  {upload.status === 'uploading' ? (
                    <Loader2 className="size-5 animate-spin text-white" aria-hidden="true" />
                  ) : (
                    <span className="text-xs text-red-300 font-medium px-1 text-center">Erro</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add photo button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Adicionar foto"
        >
          <Camera className="size-3.5" aria-hidden="true" />
          Adicionar foto
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleFileSelect}
        />
        {uploadPhoto.isError && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {uploadPhoto.error.message}
          </p>
        )}
      </div>

      {/* ── Skip row ── */}
      <div className="mt-3 pl-9">
        <AnimatePresence mode="wait">
          {isSkipConfirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">Tem certeza?</span>
              <Button
                size="xs"
                variant="destructive"
                onClick={handleSkipConfirm}
                aria-label={`Confirmar ignorar tarefa "${task.title}"`}
              >
                Sim
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setIsSkipConfirming(false)}>
                Não
              </Button>
            </motion.div>
          ) : (
            <motion.button
              key="skip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={() => setIsSkipConfirming(true)}
              aria-label={`Ignorar tarefa "${task.title}"`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <X className="size-3.5" aria-hidden="true" />
              Ignorar
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Clock row ── */}
      <div className="mt-2 pl-9 flex items-center gap-2 flex-wrap">
        {!isClockedIn && !isClockedOut && (
          <button
            type="button"
            onClick={() => {
              clockIn.mutate({ scheduleId: schedule.id })
            }}
            disabled={clockIn.isPending}
            aria-busy={clockIn.isPending}
            aria-label={`Iniciar cronômetro para "${task.title}"`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {clockIn.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Timer className="size-3.5" aria-hidden="true" />
            )}
            Iniciar
          </button>
        )}
        {isClockedIn && !isClockedOut && (
          <button
            type="button"
            onClick={() => {
              clockOut.mutate({ scheduleId: schedule.id })
            }}
            disabled={clockOut.isPending}
            aria-busy={clockOut.isPending}
            aria-label={`Parar cronômetro para "${task.title}"`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {clockOut.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Timer className="size-3.5 text-primary" aria-hidden="true" />
            )}
            Parar
          </button>
        )}
        {isClockedOut &&
          (() => {
            const dur = formatDuration(schedule.startedAt, schedule.stoppedAt)
            return dur ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="size-3.5" aria-hidden="true" />
                {dur}
              </span>
            ) : null
          })()}
        {clockIn.isError && (
          <p role="alert" className="text-xs text-destructive">
            {clockIn.error.message}
          </p>
        )}
        {clockOut.isError && (
          <p role="alert" className="text-xs text-destructive">
            {clockOut.error.message}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// RoomSection
// ---------------------------------------------------------------------------

interface RoomSectionProps {
  room: ScheduleWithDetails['task']['room']
  schedules: ScheduleWithDetails[]
  optimisticStatuses: Record<string, ScheduleStatus>
  onToggle: (schedule: ScheduleWithDetails) => void
  onSkip: (scheduleId: string) => void
}

function RoomSection({ room, schedules, optimisticStatuses, onToggle, onSkip }: RoomSectionProps) {
  return (
    <section aria-label={`Tarefas — ${room.name}`} className="mb-6">
      {/* Room header */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <span
          className="size-3 rounded-full shrink-0"
          style={{ backgroundColor: room.color }}
          aria-hidden="true"
        />
        <span className="text-base leading-none" aria-hidden="true">
          {room.icon}
        </span>
        <h2 className="text-sm font-semibold tracking-wide text-foreground">{room.name}</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {schedules.length} {schedules.length === 1 ? 'tarefa' : 'tarefas'}
        </span>
      </div>

      {/* Task cards */}
      <div role="list" aria-label={`Tarefas de ${room.name}`}>
        {schedules.map((schedule) => (
          <div key={schedule.id} role="listitem">
            <TaskCard
              schedule={schedule}
              effectiveStatus={optimisticStatuses[schedule.id] ?? schedule.status}
              onToggle={() => onToggle(schedule)}
              onSkip={() => onSkip(schedule.id)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// TodayClient — main export
// ---------------------------------------------------------------------------

/**
 * Primary user-facing page — shows today's cleaning tasks grouped by room.
 *
 * Features:
 * - Animated circular checkboxes with Framer Motion
 * - Optimistic status updates (pending ↔ completed, skip)
 * - Inline comment section (expandable)
 * - Photo upload with previews and delete
 * - Progress bar and summary counts
 * - Collapsible Golden Rule banner (session-persistent dismissal)
 * - Celebration banner when all tasks are done
 */
export function TodayClient({
  user,
  initialSchedules,
  goldenRule,
  todayLabel,
  today,
}: TodayClientProps) {
  // today ISO string is used only for query key scoping (not rendered directly,
  // which avoids the server/client timezone hydration mismatch)
  void today

  const firstName = user.name.split(' ')[0] ?? user.name

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data: schedules = initialSchedules } = useTodaySchedules(initialSchedules)

  // ── Optimistic status state ──────────────────────────────────────────────
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, ScheduleStatus>>({})

  function clearOptimistic(id: string) {
    setOptimisticStatuses((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  // ── Status mutation ──────────────────────────────────────────────────────
  const { mutate: updateStatus } = useUpdateScheduleStatus()

  function handleToggle(schedule: ScheduleWithDetails) {
    const currentStatus = optimisticStatuses[schedule.id] ?? schedule.status
    const newStatus: ScheduleStatus = currentStatus === 'completed' ? 'pending' : 'completed'

    setOptimisticStatuses((prev) => ({ ...prev, [schedule.id]: newStatus }))
    updateStatus(
      { id: schedule.id, status: newStatus },
      {
        onSuccess: () => clearOptimistic(schedule.id),
        onError: () => clearOptimistic(schedule.id),
      }
    )
  }

  function handleSkip(scheduleId: string) {
    setOptimisticStatuses((prev) => ({ ...prev, [scheduleId]: 'skipped' }))
    updateStatus(
      { id: scheduleId, status: 'skipped' },
      {
        onSuccess: () => clearOptimistic(scheduleId),
        onError: () => clearOptimistic(scheduleId),
      }
    )
  }

  // ── Derived counts ───────────────────────────────────────────────────────
  const { totalCount, completedCount, pendingCount, progressPercent } = useMemo(() => {
    const total = schedules.length
    let completed = 0
    let pending = 0
    for (const s of schedules) {
      const status = optimisticStatuses[s.id] ?? s.status
      if (status === 'completed') completed++
      else if (status === 'pending') pending++
    }
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      totalCount: total,
      completedCount: completed,
      pendingCount: pending,
      progressPercent: pct,
    }
  }, [schedules, optimisticStatuses])

  const showCelebration = totalCount > 0 && pendingCount === 0
  const showGoldenRule = goldenRule.length > 0 && schedules.some((s) => s.task.goldenRuleApplies)

  // ── Room grouping ────────────────────────────────────────────────────────
  const roomGroups = useMemo(() => groupByRoom(schedules), [schedules])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-8">
      {/* ── Header card ── */}
      <div className="mx-4 mt-6 mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Bom dia, {firstName}! ☀️</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{todayLabel}</p>

        {/* Summary row */}
        {totalCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Resumo de tarefas">
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {totalCount} {totalCount === 1 ? 'tarefa' : 'tarefas'} hoje
            </span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {completedCount} {completedCount === 1 ? 'concluída' : 'concluídas'}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso: ${progressPercent}%`}
              className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  progressPercent === 100 ? 'bg-green-500' : 'bg-primary'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-muted-foreground">
              {progressPercent}%
            </span>
          </div>
        )}
      </div>

      {/* ── Celebration banner ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            role="status"
            aria-live="polite"
            className="mx-4 mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/40 dark:bg-green-900/20"
          >
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              🎉 Todas as tarefas concluídas! Ótimo trabalho!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Golden Rule banner — permanent, always visible when applicable ── */}
      {showGoldenRule && <GoldenRuleBanner text={goldenRule} />}

      {/* ── Task list ── */}
      <div className="px-4">
        {schedules.length === 0 ? (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center gap-4 py-20 text-center"
            role="status"
            aria-live="polite"
          >
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <PartyPopper className="size-7 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold">Nenhuma tarefa para hoje!</p>
              <p className="mt-1 text-sm text-muted-foreground">Aproveite seu dia de descanso.</p>
            </div>
          </div>
        ) : (
          <main aria-label="Tarefas de hoje">
            {roomGroups.map(({ room, schedules: roomSchedules }) => (
              <RoomSection
                key={room.id}
                room={room}
                schedules={roomSchedules}
                optimisticStatuses={optimisticStatuses}
                onToggle={handleToggle}
                onSkip={handleSkip}
              />
            ))}
          </main>
        )}
      </div>
    </div>
  )
}
