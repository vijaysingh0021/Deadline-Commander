/* ─────────────────────────────────────────────────────────
   Deadline Commander · Goals
   Strategic objectives. A goal rolls up the tasks that prove
   it — progress is computed from real work, not vanity input.
   ───────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Target, Plus, Pencil, Trash2, CheckCircle2, RotateCcw,
  CalendarClock, FolderKanban, ListChecks, Link2, Flag,
} from 'lucide-react'
import { useCommand, useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useToggleGoal } from '@/hooks/useCommand'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardBody, Panel } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { cn, duePhrase } from '@/utils'
import type { Goal, Task, Deadline } from '@/types'
import type { GoalInput } from '@/services/api'

/* ── Priority chip — never color alone ─────────────────────── */
const PRIO_TONES: Record<number, string> = {
  1: 'text-tx-300 border-line',
  2: 'text-tx-300 border-line',
  3: 'text-warn-500 border-warn-500/40',
  4: 'text-high-500 border-high-500/40',
  5: 'text-crit-500 border-crit-500/40',
}

export function GoalsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCommand()
  const { data: goals, isLoading: goalsLoading } = useGoals()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const toggleGoal = useToggleGoal()

  const [tab, setTab] = useState('active')
  const [form, setForm] = useState<{ open: boolean; goal?: Goal }>({ open: false })
  const [detail, setDetail] = useState<Goal | null>(null)
  const [confirm, setConfirm] = useState<Goal | null>(null)

  const pending = useMemo(() => {
    if (!data) return null
    return {
      deadlines: data.snapshot.deadlines,
      tasks: data.snapshot.tasks,
    }
  }, [data])

  const loading = isLoading || goalsLoading || !pending
  if (loading) return <GoalsSkeleton />
  if (isError || !data || !goals) return <ErrorState onRetry={refetch} />

  const active = goals.filter((g) => g.status === 'active')
  const completed = goals.filter((g) => g.status === 'completed')
  const shown = tab === 'active' ? active : completed
  const avgProgress = active.length ? Math.round(active.reduce((a, g) => a + g.progress, 0) / active.length) : 0

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Strategic Objectives"
          title="Goals"
          subtitle="High-level wins you're working toward. Progress is computed from the tasks you complete — no manual status tracking."
          action={
            <Button variant="primary" onClick={() => setForm({ open: true })}>
              <Plus className="h-4 w-4" aria-hidden /> New Goal
            </Button>
          }
        />
      </motion.div>

      {/* Stats */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Panel className="p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-tx-500">
            <Flag className="h-3 w-3" aria-hidden /> In pursuit
          </p>
          <p className="tnum mt-1 font-display text-2xl font-bold text-tx-100">{active.length}</p>
        </Panel>
        <Panel className="p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-tx-500">
            <CheckCircle2 className="h-3 w-3 text-safe-500" aria-hidden /> Secured
          </p>
          <p className="tnum mt-1 font-display text-2xl font-bold text-safe-500">{completed.length}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">Avg focus</p>
          <p className="tnum mt-1 font-display text-2xl font-bold text-command-300">{avgProgress}%</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">Linked ops</p>
          <p className="tnum mt-1 font-display text-2xl font-bold text-tx-100">
            {goals.reduce((a, g) => a + g.linkedTasks.length, 0)}
          </p>
        </Panel>
      </motion.div>

      <motion.div variants={rise}>
        <Tabs
          items={[
            { key: 'active', label: 'Active', badge: `${active.length}` },
            { key: 'completed', label: 'Completed', badge: `${completed.length}` },
          ]}
          active={tab}
          onChange={setTab}
        />
      </motion.div>

      <motion.div variants={rise} className="grid gap-4 md:grid-cols-2">
        {shown.map((g) => {
          const deadline = pending.deadlines.find((d) => d.id === g.deadlineId)
          const linked = g.linkedTasks
            .map((id) => pending.tasks.find((t) => t.id === id))
            .filter((t): t is Task => Boolean(t))
          return (
            <Card key={g.id} className={cn(g.status === 'completed' && 'border-safe-500/20 opacity-90')}>
              {g.status === 'completed' ? <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-safe-500 to-safe-500/40" /> : null}
              <CardBody className="space-y-4 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => setDetail(g)}
                    className="min-w-0 text-left"
                    aria-label={`View goal details: ${g.title}`}
                  >
                    <h3 className={cn('font-display text-base font-bold tracking-tight text-tx-100 hover:text-command-300', g.status === 'completed' && 'line-through text-tx-500')}>
                      {g.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-tx-500">{g.description}</p>
                  </button>
                  <span className={cn('shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold', PRIO_TONES[g.priority])}>
                    P{g.priority}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {deadline ? (
                    <button
                      onClick={() => navigate(`/deadline/${deadline.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-ink-900/60 px-2 py-0.5 text-[11px] font-semibold text-command-300 transition-colors hover:border-command-500/40"
                      aria-label={`Open ${deadline.title}`}
                    >
                      <FolderKanban className="h-3 w-3" aria-hidden /> {deadline.title}
                    </button>
                  ) : null}
                  {g.dueDate ? (
                    <Badge tone="neutral" dot>{duePhrase(g.dueDate)}</Badge>
                  ) : null}
                  <span className="inline-flex items-center gap-1 text-[11px] text-tx-500">
                    <ListChecks className="h-3 w-3" aria-hidden /> {linked.length} ops
                  </span>
                </div>

                <ProgressBar value={g.progress} tone={g.status === 'completed' ? 'safe' : g.priority >= 4 ? 'crit' : 'cmd'} height="h-1.5" showLabel label="Progress" />

                <div className="flex flex-wrap items-center gap-2">
                  {g.status === 'active' ? (
                    <Button variant="primary" style="outline" size="sm" onClick={() => toggleGoal.mutate(g.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Complete
                    </Button>
                  ) : (
                    <Button variant="secondary" style="outline" size="sm" onClick={() => toggleGoal.mutate(g.id)}>
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reopen
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setForm({ open: true, goal: g })}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-tx-500 hover:text-crit-500" onClick={() => setConfirm(g)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </motion.div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<Target className="h-5 w-5" aria-hidden />}
          title={tab === 'active' ? 'NO ACTIVE GOALS' : 'NO COMPLETED GOALS'}
          body={tab === 'active' ? 'Lock in a strategic objective to give your missions a target.' : 'Complete a goal and it will be archived here.'}
          action={tab === 'active' ? <Button variant="primary" onClick={() => setForm({ open: true })}><Plus className="h-4 w-4" aria-hidden /> New Goal</Button> : undefined}
        />
      ) : null}

      {/* Create / edit modal */}
      {pending && (
        <GoalFormModal
          open={form.open}
          goal={form.goal}
          deadlines={pending.deadlines}
          tasks={pending.tasks}
          onClose={() => setForm({ open: false })}
          onSubmit={(input) => {
            if (form.goal) updateGoal.mutate({ goalId: form.goal.id, input })
            else createGoal.mutate(input)
            setForm({ open: false })
          }}
        />
      )}

      {/* Detail modal */}
      {detail ? (
        <GoalDetailModal goal={detail} deadlines={pending.deadlines} tasks={pending.tasks} onClose={() => setDetail(null)} />
      ) : null}

      {/* Delete confirm */}
      {confirm ? (
        <Modal
          open
          onClose={() => setConfirm(null)}
          eyebrow="Destructive"
          title="ABANDON GOAL?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deleteGoal.mutate(confirm.id); setConfirm(null) }}>
                <Trash2 className="h-4 w-4" aria-hidden /> Abandon
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-tx-400">
            This removes <span className="font-semibold text-tx-100">“{confirm.title}”</span> from the board. Linked tasks are untouched.
          </p>
        </Modal>
      ) : null}
    </motion.div>
  )
}

/* ── Form ──────────────────────────────────────────────────── */

function GoalFormModal({
  open,
  goal,
  deadlines,
  tasks,
  onClose,
  onSubmit,
}: {
  open: boolean
  goal?: Goal
  deadlines: Deadline[]
  tasks: Task[]
  onClose: () => void
  onSubmit: (input: GoalInput) => void
}) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [priority, setPriority] = useState(goal?.priority ?? 3)
  const [deadlineId, setDeadlineId] = useState(goal?.deadlineId ?? '')
  const [dueDate, setDueDate] = useState(goal?.dueDate ? goal.dueDate.slice(0, 10) : '')
  const [linked, setLinked] = useState<string[]>(goal?.linkedTasks ?? [])

  const deadlineTasks = deadlineId ? tasks.filter((t) => t.deadlineId === deadlineId) : tasks
  const toggleLink = (id: string) =>
    setLinked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const valid = title.trim().length > 0

  const submit = () => {
    if (!valid) return
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      deadlineId: deadlineId || undefined,
      dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : undefined,
      linkedTasks: linked,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={goal ? 'Edit objective' : 'New objective'}
      title={goal ? 'EDIT GOAL' : 'SET A NEW GOAL'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={submit}>
            {goal ? 'Save changes' : 'Lock it in'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Objective">
          <input
            className="w-full rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 placeholder:text-tx-600 focus:border-command-500/60 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ship the dashboard analytics"
            autoFocus
          />
        </Field>
        <Field label="Description">
          <textarea
            className="w-full resize-none rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 placeholder:text-tx-600 focus:border-command-500/60 focus:outline-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What proves this goal is achieved?"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Priority">
            <select
              className="w-full rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 focus:border-command-500/60 focus:outline-none"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((p) => (
                <option key={p} value={p}>P{p} — {p === 5 ? 'Critical' : p === 4 ? 'High' : p === 3 ? 'Normal' : p === 2 ? 'Low' : 'Backlog'}</option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="w-full rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 focus:border-command-500/60 focus:outline-none"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field label="Linked deadline">
            <select
              className="w-full rounded-lg border border-line bg-ink-900/70 px-3 py-2 text-sm text-tx-100 focus:border-command-500/60 focus:outline-none"
              value={deadlineId}
              onChange={(e) => setDeadlineId(e.target.value)}
            >
              <option value="">None</option>
              {deadlines.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={`Proving operations (${linked.length})`}>
          <p className="mb-2 text-xs text-tx-500">Checking a task counts its completion toward this goal's progress.</p>
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-line-soft bg-ink-900/40 p-2">
            {deadlineTasks.length === 0 ? (
              <p className="px-2 py-1 text-xs text-tx-500">No tasks in this scope yet. Add tasks from the Operations page first.</p>
            ) : null}
            {deadlineTasks.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-tx-300 transition-colors hover:bg-ink-800">
                <input
                  type="checkbox"
                  checked={linked.includes(t.id)}
                  onChange={() => toggleLink(t.id)}
                  className="h-4 w-4 accent-[#2de2c3]"
                />
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <span className="text-[11px] text-tx-500">{t.status === 'done' ? 'done' : 'open'}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">{label}</span>
      {children}
    </label>
  )
}

/* ── Detail ────────────────────────────────────────────────── */

function GoalDetailModal({
  goal,
  deadlines,
  tasks,
  onClose,
}: {
  goal: Goal
  deadlines: Deadline[]
  tasks: Task[]
  onClose: () => void
}) {
  const navigate = useNavigate()
  const deadline = deadlines.find((d) => d.id === goal.deadlineId)
  const linked = goal.linkedTasks
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is Task => Boolean(t))

  return (
    <Modal open onClose={onClose} eyebrow="Objective dossier" title={goal.title} size="xl">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-tx-300">{goal.description}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Priority" value={`P${goal.priority}`} />
          <StatBox label="Progress" value={`${goal.progress}%`} />
          <StatBox
            label="Status"
            value={goal.status === 'completed' ? 'Secured' : 'Active'}
            tone={goal.status === 'completed' ? 'text-safe-500' : 'text-command-300'}
          />
          <StatBox
            label="Due"
            value={goal.dueDate ? duePhrase(goal.dueDate) : '—'}
            tone={goal.dueDate ? 'text-high-500' : undefined}
          />
        </div>

        <ProgressBar value={goal.progress} tone={goal.status === 'completed' ? 'safe' : 'cmd'} height="h-2" showLabel label="Goal progress" />

        {deadline ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-command-500/20 bg-command-500/[0.05] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-command-500/10 text-command-300">
                <FolderKanban className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tx-500">Linked deadline</p>
                <p className="text-sm font-semibold text-tx-100">{deadline.title}</p>
              </div>
            </div>
            <Button variant="primary" style="outline" size="sm" onClick={() => { onClose(); navigate(`/deadline/${deadline.id}`) }}>
              <Link2 className="h-3.5 w-3.5" aria-hidden /> Open
            </Button>
          </div>
        ) : null}

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-tx-500">
            <ListChecks className="h-3 w-3" aria-hidden /> Proving operations ({linked.length})
          </p>
          <div className="space-y-1.5">
            {linked.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-ink-900/50 px-3.5 py-2.5">
                <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold', t.status === 'done' ? 'border-safe-500 bg-safe-500 text-ink-950' : 'border-tx-600 text-tx-500')}>
                  {t.status === 'done' ? '✓' : ''}
                </span>
                <span className={cn('min-w-0 flex-1 truncate text-sm', t.status === 'done' ? 'text-tx-500 line-through' : 'text-tx-200')}>{t.title}</span>
              </div>
            ))}
            {linked.length === 0 ? (
              <p className="text-sm text-tx-500">No linked operations — progress is tracked manually on this goal.</p>
            ) : null}
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-tx-500">
          <CalendarClock className="h-3 w-3" aria-hidden />
          Set {new Date(goal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {goal.completedAt ? ` · completed ${new Date(goal.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
        </p>
      </div>
    </Modal>
  )
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line-soft bg-ink-900/50 px-3.5 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">{label}</p>
      <p className={cn('tnum mt-0.5 font-display text-lg font-bold', tone ?? 'text-tx-100')}>{value}</p>
    </div>
  )
}

function GoalsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-ink-800/80" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-ink-800/80" />)}
      </div>
    </div>
  )
}