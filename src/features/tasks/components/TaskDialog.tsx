'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, ChevronUp, ChevronDown, Plus, Loader2 } from 'lucide-react'
import {
  useCreateTask,
  useUpdateTask,
  useTaskItems,
  useCreateTaskItem,
  useUpdateTaskItem,
  useDeleteTaskItem,
} from '../hooks/useTasks'
import type { Task } from '../types'
import type { Room } from '@/features/rooms/types'
import type { Category } from '@/features/categories/types'

// ─── Days ────────────────────────────────────────────────────────────────────

const DAYS_PT = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

// ─── Form schema ─────────────────────────────────────────────────────────────
// Booleans are NOT optional/defaulted in the schema — defaults live in useForm's
// defaultValues to avoid the input/output type mismatch that triggers a TS error
// when passing zodResolver to useForm.

const taskDialogSchema = z.object({
  roomId: z.string().min(1, 'Selecione uma sala'),
  categoryId: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  estimatedMinutes: z.number().int().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 480 minutos'),
  priority: z.enum(['low', 'medium', 'high']),
  active: z.boolean(),
  goldenRuleApplies: z.boolean(),
  frequencyEnabled: z.boolean(),
  frequencyType: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']).optional(),
  // Days of week managed via setValue + useWatch (avoids separate useState + useEffect)
  frequencyDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  // 0 sentinel means "not selected"; resolved to null/undefined in onSubmit
  frequencyWeekOfMonth: z.number().int().min(0).max(5).optional(),
  frequencyDayOfMonth: z.number().int().min(0).max(31).optional(),
})

type TaskDialogFormValues = z.infer<typeof taskDialogSchema>

// ─── Pre-fill logic ──────────────────────────────────────────────────────────

const BATHROOM_KEYWORDS = ['banheiro', 'lavabo']
const BEDROOM_KEYWORDS = ['suíte', 'suite', 'quarto', 'dormitório']

function getDescriptionPreFill(roomName: string): string | undefined {
  const lower = roomName.toLowerCase()
  if (BATHROOM_KEYWORDS.some((k) => lower.includes(k))) {
    return 'Limpar box e nicho, Aplicar cloro, Lavar pia e vaso'
  }
  if (BEDROOM_KEYWORDS.some((k) => lower.includes(k))) {
    return 'Limpar ventilador de teto (incluído nesta tarefa)'
  }
  return undefined
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  rooms: Room[]
  categories: Category[]
}

// ─── SubtaskEditor ───────────────────────────────────────────────────────────

interface SubtaskEditorProps {
  taskId: string
}

/**
 * Inline subtask (task item) editor displayed inside the TaskDialog when editing.
 * Allows adding, reordering, and deleting subtasks via the task-items API.
 */
function SubtaskEditor({ taskId }: SubtaskEditorProps) {
  const { data: items = [], isLoading } = useTaskItems(taskId)
  const createItem = useCreateTaskItem()
  const updateItem = useUpdateTaskItem()
  const deleteItem = useDeleteTaskItem()

  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')

  function handleAdd() {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    createItem.mutate(
      { taskId, title: trimmed, note: newNote.trim() || undefined },
      {
        onSuccess: () => {
          setNewTitle('')
          setNewNote('')
        },
      }
    )
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const item = items[index]
    const prev = items[index - 1]
    updateItem.mutate({ taskId, itemId: item.id, displayOrder: prev.displayOrder })
    updateItem.mutate({ taskId, itemId: prev.id, displayOrder: item.displayOrder })
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return
    const item = items[index]
    const next = items[index + 1]
    updateItem.mutate({ taskId, itemId: item.id, displayOrder: next.displayOrder })
    updateItem.mutate({ taskId, itemId: next.id, displayOrder: item.displayOrder })
  }

  function handleDelete(itemId: string) {
    deleteItem.mutate({ taskId, itemId })
  }

  const inputClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <p className="text-sm font-medium">Subtarefas</p>

      {isLoading && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Carregando...
        </p>
      )}

      {/* Existing items */}
      {items.length > 0 && (
        <ul className="space-y-1.5" aria-label="Subtarefas existentes">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || updateItem.isPending}
                  aria-label={`Mover "${item.title}" para cima`}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1 || updateItem.isPending}
                  aria-label={`Mover "${item.title}" para baixo`}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Title + note */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug truncate">{item.title}</p>
                {item.note && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.note}</p>
                )}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deleteItem.isPending}
                aria-label={`Excluir subtarefa "${item.title}"`}
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground">Nenhuma subtarefa cadastrada.</p>
      )}

      {/* Add new item */}
      <div className="space-y-1.5 pt-1">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Nova subtarefa..."
          maxLength={255}
          aria-label="Título da nova subtarefa"
          className={inputClass}
        />
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Observação (opcional)"
          maxLength={2000}
          aria-label="Observação da nova subtarefa"
          className={inputClass}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={!newTitle.trim() || createItem.isPending}
          aria-busy={createItem.isPending}
        >
          {createItem.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-3.5" aria-hidden="true" />
          )}
          Adicionar subtarefa
        </Button>
        {createItem.isError && (
          <p role="alert" className="text-xs text-destructive">
            {createItem.error.message}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

const DEFAULT_VALUES: TaskDialogFormValues = {
  roomId: '',
  categoryId: '',
  title: '',
  description: '',
  estimatedMinutes: 30,
  priority: 'medium',
  active: true,
  goldenRuleApplies: true,
  frequencyEnabled: false,
  frequencyType: 'weekly',
  frequencyDaysOfWeek: [],
  frequencyWeekOfMonth: 0,
  frequencyDayOfMonth: 0,
}

/**
 * Modal dialog for creating or editing a Task.
 * Includes an embedded frequency section for scheduling configuration.
 * Days-of-week selection is managed via react-hook-form setValue/useWatch
 * to avoid setState inside useEffect (React Compiler compatibility).
 */
export function TaskDialog({ open, onOpenChange, task, rooms, categories }: TaskDialogProps) {
  const isEditing = !!task

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskDialogFormValues>({
    resolver: zodResolver(taskDialogSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // useWatch (hooks) instead of watch() to satisfy the React Compiler ESLint rule
  const watchedRoomId = useWatch({ control, name: 'roomId' })
  const frequencyEnabled = useWatch({ control, name: 'frequencyEnabled' })
  const frequencyType = useWatch({ control, name: 'frequencyType' })
  const selectedDays = useWatch({ control, name: 'frequencyDaysOfWeek' }) ?? []

  const showDaysOfWeek =
    !!frequencyEnabled &&
    (frequencyType === 'weekly' || frequencyType === 'biweekly' || frequencyType === 'custom')
  const showMonthlyFields = !!frequencyEnabled && frequencyType === 'monthly'

  /* Auto pre-fill description when room is selected in create mode */
  useEffect(() => {
    if (isEditing || !watchedRoomId) return
    const room = rooms.find((r) => r.id === watchedRoomId)
    if (!room) return
    const preFill = getDescriptionPreFill(room.name)
    if (preFill) {
      setValue('description', preFill)
    }
  }, [watchedRoomId, isEditing, rooms, setValue])

  /* Populate form when editing or reset when dialog is closed/reopened */
  useEffect(() => {
    if (task) {
      const freq = task.frequency
      reset({
        roomId: task.roomId,
        categoryId: task.categoryId ?? '',
        title: task.title,
        description: task.description ?? '',
        estimatedMinutes: task.estimatedMinutes,
        priority: task.priority,
        active: task.active,
        goldenRuleApplies: task.goldenRuleApplies,
        frequencyEnabled: !!freq,
        frequencyType: freq?.type ?? 'weekly',
        frequencyDaysOfWeek: freq?.daysOfWeek ?? [],
        frequencyWeekOfMonth: freq?.weekOfMonth ?? 0,
        frequencyDayOfMonth: freq?.dayOfMonth ?? 0,
      })
    } else {
      reset(DEFAULT_VALUES)
    }
  }, [task, reset])

  const toggleDay = (day: number) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day]
    setValue('frequencyDaysOfWeek', next)
  }

  const onSubmit = async (data: TaskDialogFormValues) => {
    const frequencyPayload =
      data.frequencyEnabled && data.frequencyType
        ? {
            type: data.frequencyType,
            daysOfWeek: showDaysOfWeek ? (data.frequencyDaysOfWeek ?? []) : [],
            weekOfMonth:
              showMonthlyFields && data.frequencyWeekOfMonth ? data.frequencyWeekOfMonth : null,
            dayOfMonth:
              showMonthlyFields && data.frequencyDayOfMonth ? data.frequencyDayOfMonth : null,
          }
        : undefined

    const taskPayload = {
      roomId: data.roomId,
      categoryId: data.categoryId || undefined,
      title: data.title,
      description: data.description || undefined,
      estimatedMinutes: data.estimatedMinutes,
      priority: data.priority,
      active: data.active,
      goldenRuleApplies: data.goldenRuleApplies,
      frequency: frequencyPayload,
    }

    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, ...taskPayload })
      } else {
        await createTask.mutateAsync(taskPayload)
      }
      onOpenChange(false)
    } catch {
      // Error is surfaced via mutation state
    }
  }

  const mutationError = isEditing ? updateTask.error : createTask.error

  // Shared class strings for form controls lacking a dedicated UI component
  const selectClass =
    'flex h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'
  const textareaClass =
    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none'

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="task-dialog-description"
        className="max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tarefa' : 'Criar Tarefa'}</DialogTitle>
          <DialogDescription id="task-dialog-description">
            {isEditing
              ? 'Atualize os detalhes da tarefa e sua frequência abaixo.'
              : 'Preencha os detalhes para cadastrar uma nova tarefa.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          {/* ── Task details ────────────────────────────────────────────── */}

          {/* Room */}
          <div className="space-y-1.5">
            <Label htmlFor="task-room">Sala *</Label>
            <select
              id="task-room"
              className={selectClass}
              aria-invalid={!!errors.roomId}
              {...register('roomId')}
            >
              <option value="">Selecione uma sala</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.icon} {room.name}
                </option>
              ))}
            </select>
            {errors.roomId && (
              <p className="text-xs text-destructive" role="alert">
                {errors.roomId.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="task-category">
              Categoria{' '}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <select id="task-category" className={selectClass} {...register('categoryId')}>
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              placeholder="Ex: Lavar banheiro"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description">
              Descrição{' '}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              id="task-description"
              placeholder="Ex: Limpar box e nicho, Aplicar cloro, Lavar pia e vaso"
              className={textareaClass}
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Estimated minutes + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-minutes">Tempo estimado *</Label>
              <div className="relative">
                <Input
                  id="task-minutes"
                  type="number"
                  min={5}
                  max={480}
                  placeholder="30"
                  aria-invalid={!!errors.estimatedMinutes}
                  {...register('estimatedMinutes', { valueAsNumber: true })}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  min
                </span>
              </div>
              {errors.estimatedMinutes && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.estimatedMinutes.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Prioridade *</Label>
              <select
                id="task-priority"
                className={selectClass}
                aria-invalid={!!errors.priority}
                {...register('priority')}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
              {errors.priority && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          {/* Toggles: Active + Golden Rule */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                id="task-active"
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                {...register('active')}
              />
              <Label htmlFor="task-active" className="cursor-pointer font-normal">
                Tarefa ativa
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="task-golden-rule"
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                {...register('goldenRuleApplies')}
              />
              <Label htmlFor="task-golden-rule" className="cursor-pointer font-normal">
                Regra de ouro aplicável
              </Label>
            </div>
          </div>

          {/* ── Frequency section ────────────────────────────────────────── */}
          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="task-frequency-enabled"
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                {...register('frequencyEnabled')}
              />
              <Label htmlFor="task-frequency-enabled" className="cursor-pointer font-medium">
                Frequência
              </Label>
            </div>

            {frequencyEnabled && (
              <div className="space-y-4 pl-6">
                {/* Frequency type */}
                <div className="space-y-1.5">
                  <Label htmlFor="task-freq-type">Tipo *</Label>
                  <select
                    id="task-freq-type"
                    className={selectClass}
                    {...register('frequencyType')}
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quinzenal</option>
                    <option value="monthly">Mensal</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>

                {/* Days of week — pill toggles */}
                {showDaysOfWeek && (
                  <div className="space-y-2">
                    <Label>Dias da semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_PT.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                            selectedDays.includes(day.value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                          }`}
                          aria-pressed={selectedDays.includes(day.value)}
                          aria-label={day.label}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly options */}
                {showMonthlyFields && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="task-week-of-month">Semana do mês</Label>
                      <select
                        id="task-week-of-month"
                        className={selectClass}
                        {...register('frequencyWeekOfMonth', { valueAsNumber: true })}
                      >
                        <option value={0}>Selecione</option>
                        <option value={1}>1ª semana</option>
                        <option value={2}>2ª semana</option>
                        <option value={3}>3ª semana</option>
                        <option value={4}>4ª semana</option>
                        <option value={5}>5ª semana</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="task-day-of-month">Dia do mês (1–31)</Label>
                      <Input
                        id="task-day-of-month"
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Ex: 15"
                        {...register('frequencyDayOfMonth', { valueAsNumber: true })}
                      />
                      {errors.frequencyDayOfMonth && (
                        <p className="text-xs text-destructive" role="alert">
                          {errors.frequencyDayOfMonth.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Subtarefas section (only when editing an existing task) ── */}
          {isEditing && task && <SubtaskEditor taskId={task.id} />}

          {/* Mutation error */}
          {mutationError && (
            <p
              className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2"
              role="alert"
            >
              {mutationError.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              }
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
