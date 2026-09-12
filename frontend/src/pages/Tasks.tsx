/* ─────────────────────────────────────────────────────────
   Deadline Commander · Tasks
   The operations board. Every task on every deadline, with
   full CRUD, search, filters, sorting and launch-to-focus.
   ───────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ListChecks, Plus, Pencil, Trash2, Play, Search, Swords,
  Check, Clock, Zap, CircleDot,
} from 'lucide-react'
import {
  useCommand, useSetMissionStatus, useCreateTask, useUpdateTask,
  useDeleteTask, useCompleteTask, useFlipTaskStatus,
} from '@/hooks/useCommand'
import { useUi } from '@/stores/ui'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardBody, Panel } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { cn, minutesLabel } from '@/utils'
import type { Task, Deadline } from '@/types'
import type { TaskInput } from '@/services/api'

const STATUS_ORDER = { todo: 0, in_progress: 1, done: 2 } as const
const PRIO_TONES: Record<number, string> = {
  1: 'text-tx-300 border-line',
  2: 'text-tx-300 border-line',
  3: 'text-warn-500 border-warn-500/40',
  4: 'text-high-500 border-high-500/40',
  5: 'text-crit-500 border-crit-500/40',
}

type Filter = 'ALL' | 'todo' | 'in_progress' | 'done'
type SortKey = 'priority' | 'effort' | 'due' | 'title'

export function TasksPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCommand()
  const setStatus = useSetMissionStatus()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const completeTask = useCompleteTask()
  const flipStatus = useFlipTaskStatus()
  const setFocus = useUi((s) => s.setFocus)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [sort, setSort] = useState<SortKey>('priority')
  const [form, setForm] = useState<{ open: boolean; task?: Task }>({ open: false })
  const [confirm, setConfirm] = useState<Task | null>(null)

  const rows = useMemo(() => {
    if (!data) return []
    const deadlines = data.snapshot.deadlines
    const byDeadline = new Map<string, Deadline>(deadlines.map((d) => [d.id, d]))
    const missions = data.snapshot.missions

    let out = data.snapshot.tasks.map((t) => ({ task: t, deadline: byDeadline.get(t.deadlineId), mission: missions.find((m) => m.taskId === t.id) }))
    if (filter !== 'ALL') out = out.filter((r) => r.task.status === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      out = out.filter((r) => r.task.title.toLowerCase().includes(q) || r.deadline?.title.toLowerCase().includes(q))
    }
    out.sort((a, b) => {
      switch (sort) {
        case 'priority': return b.task.priority - a.task.priority || a.task.title.localeCompare(b.task.title)
        case 'effort': return a.task.estimatedMinutes - b.task.estimatedMinutes
        case 'due': return new Date(a.deadline?.dueDate ?? '9999').getTime() - new Date(b.deadline?.dueDate ?? '9999').getTime()
        case 'title': return a.task.title.localeCompare(b.task.title)
      }
    })
    out.sort((a, b) => STATUS_ORDER[a.task.status] - STATUS_ORDER[b.task.status])
    return out
  }, [data, query, filter, sort])

  if (isLoading) return <TasksSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const tasks = data.snapshot.tasks
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const open = tasks.filter((t) => t.status === 'todo').length

  const startTask = (taskId: string) => {
    const row = data.snapshot.missions.find((m) => m.taskId === taskId)
    if (row) {
      setStatus.mutate({ missionId: row.id, status: 'in_progress' })
      setFocus({ phase: 'running', missionId: row.id })
    } else {
      flipStatus.mutate({ taskId, next: 'in_progress' })
    }
  }

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Operations Board"
          title="Tasks"
          subtitle="Every operation across every deadline. Search, filter, sort, launch into focus mode, or complete a task on the spot."
          action={
            <Button variant="primary" onClick={() => setForm({ open: true })}>
              <Plus className="h-4 w-4" aria-hidden /> New Task
            </Button>
          }
        />
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <Panel className="p-3.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Open</p>
          <p className="tnum mt-0.5 font-display text-xl font-bold text-tx-100">{open}</p>
        </Panel>
        <Panel className="p-3.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">In progress</p>
          <p className="tnum mt-0.5 font-display text-xl font-bold text-command-300">{inProgress}</p>
        </Panel>
        <Panel className="p-3.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Secured</p>
          <p className="tnum mt-0.5 font-display text-xl font-bold text-safe-500">{done}</p>
        </Panel>
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={rise}>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tx-500" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search operations…"
              aria-label="Search tasks"
              className="h-10 w-full rounded-lg border border-line bg-ink-900/70 pl-9 pr-3 text-sm text-tx-100 placeholder:text-tx-600 focus:border-command-500/60 focus:outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            aria-label="Filter by status"
            className="h-10 rounded-lg border border-line bg-ink-900/70 px-3 text-sm text-tx-200 focus:border-command-500/60 focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="todo">Open</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort tasks"
            className="h-10 rounded-lg border border-line bg-ink-900/70 px-3 text-sm text-tx-200 focus:border-command-500/60 focus:outline-none"
          >
            <option value="priority">Sort · Priority</option>
            <option value="effort">Sort · Effort</option>
            <option value="due">Sort · Deadline</option>
            <option value="title">Sort · Title</option>
          </select>
        </div>
      </motion.div>

      {/* List */}
      <motion.div variants={rise}>
        <Card>
          <CardBody className="space-y-2 pt-4">
            {rows.map(({ task, deadline, mission }) => (
              <TaskRow
                key={task.id}
                task={task}
                deadline={deadline}
                hasMission={Boolean(mission)}
                completedTone={task.status === 'done'}
                onStart={() => startTask(task.id)}
                onToggle={() => (task.status === 'done' ? flipStatus.mutate({ taskId: task.id, next: 'todo' }) : completeTask.mutate(task.id))}
                onEdit={() => setForm({ open: true, task })}
                onDelete={() => setConfirm(task)}
                onOpenDeadline={() => deadline && navigate(`/deadline/${deadline.id}`)}
              />
            ))}
            {rows.length === 0 ? (
              <EmptyState
                icon={<ListChecks className="h-5 w-5" aria-hidden />}
                title="NO OPERATIONS FOUND"
                body={query || filter !== 'ALL' ? 'Adjust your search or filters to find operations.' : 'Add a task to start building your mission list.'}
                action={!query && filter === 'ALL' ? <Button variant="primary" onClick={() => setForm({ open: true })}><Plus className="h-4 w-4" aria-hidden /> New Task</Button> : undefined}
              />
            ) : null}
          </CardBody>
        </Card>
      </motion.div>

      {/* Create / edit */}
      {data && (
        <TaskFormModal
          open={form.open}
          task={form.task}
          deadlines={data.snapshot.deadlines}
          onClose={() => setForm({ open: false })}
          onSubmit={(input) => {
            if (form.task) updateTask.mutate({ taskId: form.task.id, patch: input })
            else createTask.mutate(input)
            setForm({ open: false })
          }}
        />
      )}

      {/* Delete confirm */}
      {confirm ? (
        <Modal
          open
          onClose={() => setConfirm(null)}
          eyebrow="Destructive"
          title="STRIKE OPERATION?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deleteTask.mutate(confirm.id); setConfirm(null) }}>
                <Trash2 className="h-4 w-4" aria-hidden /> Delete
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-tx-400">
            This removes <span className="font-semibold text-tx-100">“{confirm.title}”</span> and its linked mission. Progress on the deadline will be recomputed.
          </p>
        </Modal>
      ) : null}
    </motion.div>
  )
}

function TaskRow({
  task, deadline, hasMission, completedTone, onStart, onToggle, onEdit, onDelete, onOpenDeadline,
}: {
  task: Task
  deadline?: Deadline
  hasMission: boolean
  completedTone: boolean
  onStart: () => void
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenDeadline: () => void
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 rounded-lg border px-3.5 py-3', completedTone ? 'border-line-soft bg-ink-900/30' : 'border-line-soft bg-ink-900/50')}>
      <button
        onClick={onToggle}
        aria-label={completedTone ? 'Mark as open' : 'Complete task'}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors',
          completedTone ? 'border-safe-500 bg-safe-500 text-ink-950' : 'border-tx-600 text-transparent hover:border-command-500/60',
        )}
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold text-tx-200', completedTone && 'line-through text-tx-500')}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-tx-500">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden /> {minutesLabel(task.estimatedMinutes)}</span>
          {deadline ? (
            <button onClick={onOpenDeadline} className="inline-flex items-center gap-1 text-command-300/90 transition-colors hover:text-command-300" aria-label={`Open ${deadline.title}`}>
              <CircleDot className="h-3 w-3" aria-hidden /> {deadline.title}
            </button>
          ) : null}
          {task.criticalPath ? <Badge tone="crit">critical</Badge> : null}
          {task.status === 'in_progress' ? <Badge tone="cmd" dot>running</Badge> : null}
          {hasMission ? <span className="inline-flex items-center gap-0.5 text-xp-500"><Zap className="h-3 w-3" aria-hidden /> mission</span> : null}
        </div>
      </div>

      <span className={cn('hidden shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold sm:inline', PRIO_TONES[task.priority])}>
        P{task.priority}
      </span>

      <div className="flex items-center gap-1.5">
        {!completedTone ? (
          <Button variant="primary" style="outline" size="sm" onClick={onStart}>
            <Play className="h-3.5 w-3.5" aria-hidden /> {hasMission ? 'Start' : 'Run'}
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit task">
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" className="text-tx-500 hover:text-crit-500" onClick={onDelete} aria-label="Delete task">
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

function TaskFormModal({
  open, task, deadlines, onClose, onSubmit,
}: {
  open: boolean
  task?: Task
  deadlines: Deadline[]
  onClose: () => void
  onSubmit: (input: TaskInput) => void
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [deadlineId, setDeadlineId] = useState(task?.deadlineId ?? deadlines[0]?.id ?? '')
  const [minutes, setMinutes] = useState(task?.estimatedMinutes ?? 40)
  const [priority, setPriority] = useState(task?.priority ?? 3)
  const valid = title.trim().length > 0 && deadlineId !== ''

  const submit = () => {
    if (!valid) return
    onSubmit({ title: title.trim(), estimatedMinutes: Math.max(10, minutes), priority, deadlineId })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={task ? 'Edit operation' : 'New operation'}
      title={task ? 'EDIT TASK' : 'ENLIST A NEW TASK'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={submit}>
            {task ? 'Save changes' : 'Enlist'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Operation</span>
          <input
            autoFocus
            className="w-full rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 placeholder:text-tx-600 focus:border-command-500/60 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Refactor the planner reducer"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Deadline</span>
            <select
              className="w-full rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 focus:border-command-500/60 focus:outline-none"
              value={deadlineId}
              onChange={(e) => setDeadlineId(e.target.value)}
            >
              {deadlines.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Effort (min)</span>
            <input
              type="number"
              min={10}
              step={5}
              className="w-full rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 focus:border-command-500/60 focus:outline-none"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Priority</span>
            <select
              className="w-full rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 focus:border-command-500/60 focus:outline-none"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((p) => <option key={p} value={p}>P{p}</option>)}
            </select>
          </label>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-tx-500">
          <Swords className="h-3 w-3" aria-hidden /> A mission will be spawned automatically — start it from here or Missions.
        </p>
      </div>
    </Modal>
  )
}

function TasksSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => <div key={i} className="h-10 flex-1 animate-pulse rounded-lg bg-ink-800/80" />)}
      </div>
      <div className="rounded-xl border border-line-soft bg-ink-800/80 p-3">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="my-2 h-16 animate-pulse rounded-lg bg-ink-700/50" />)}
      </div>
    </div>
  )
}