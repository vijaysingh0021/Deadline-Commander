/* ─────────────────────────────────────────────────────────
   Deadline Commander · Deadline Detail
   One boss, faced head-on: HP bar, risk with the WHY,
   milestone orbit, dependency chain and task list.
   ───────────────────────────────────────────────────────── */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Swords, Link2, Check, CircleDot, Clock, CalendarClock } from 'lucide-react'
import { useCommand, useProposeReplan } from '@/hooks/useCommand'
import { useUi } from '@/stores/ui'
import { useSetMissionStatus } from '@/hooks/useCommand'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, Panel } from '@/components/ui/Card'
import { Badge, RiskBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { RiskGauge } from '@/components/deadlines/RiskGauge'
import { BossHealth } from '@/components/deadlines/BossHealth'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { ReplanModal } from '@/components/common/ReplanModal'
import { rise, stagger } from '@/animations'
import { cn, duePhrase, minutesLabel } from '@/utils'
import type { Milestone, Task } from '@/types'

export function DeadlineDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCommand()
  const propose = useProposeReplan()
  const setFocus = useUi((s) => s.setFocus)
  const setStatus = useSetMissionStatus()
  const [replanOpen, setReplanOpen] = useState(false)

  const detail = useMemo(() => {
    if (!data || !id) return null
    const deadline = data.snapshot.deadlines.find((d) => d.id === id)
    if (!deadline) return null
    const milestones = data.snapshot.milestones.filter((m) => m.deadlineId === id).sort((a, b) => a.order - b.order)
    const tasks = data.snapshot.tasks.filter((t) => t.deadlineId === id)
    const assessment = data.riskByDeadline.get(id)
    const boss = data.boss.get(id) ?? deadline.progress
    const blockedBy = deadline.lockedBy ? data.snapshot.deadlines.find((d) => d.id === deadline.lockedBy) : undefined
    const missions = data.snapshot.missions.filter((m) => m.deadlineId === id)
    return { deadline, milestones, tasks, assessment, boss, blockedBy, missions }
  }, [data, id])

  if (isLoading) return <DetailSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const d = detail
  if (!d) return <ErrorState title="TARGET NOT FOUND" body="This deadline does not exist." onRetry={() => refetch()} />

  const { deadline, milestones, tasks, assessment, boss, blockedBy, missions } = d

  const launchMission = (missionId: string) => {
    setStatus.mutate({ missionId, status: 'in_progress' })
    setFocus({ phase: 'running', missionId })
  }

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <Link to="/deadlines" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-tx-500 transition-colors hover:text-tx-300">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Threat board
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-command-300/90">{deadline.subject}</p>
          {assessment && <RiskBadge level={assessment.level} size="md" />}
          <Badge tone="neutral" dot>{duePhrase(deadline.dueDate)}</Badge>
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-tx-100 sm:text-4xl">{deadline.title}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-tx-500">{deadline.blurb}</p>
      </motion.div>

      {/* Boss + risk */}
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div variants={rise}>
          <BossHealth deadline={deadline} milestones={milestones} health={boss} />
        </motion.div>
        <motion.div variants={rise}>
          <Card className="h-full">
            <CardHeader
              eyebrow={<><Swords className="h-3 w-3" aria-hidden /> Risk Analysis</>}
              title={assessment ? `${assessment.score}% ${assessment.level}` : 'No assessment'}
            />
            <CardBody className="space-y-4">
              {assessment && (
                <>
                  <RiskGauge assessment={assessment} />
                  <div className="rounded-lg border border-line-soft bg-ink-900/60 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tx-500">Why</p>
                    <p className="mt-1 text-sm leading-relaxed text-tx-300">{assessment.why}</p>
                  </div>
                  {assessment.blockers.length > 0 ? (
                    <ul className="space-y-1.5">
                      {assessment.blockers.map((b, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-warn-500">
                          <CircleDot className="h-3 w-3 shrink-0" aria-hidden /> {b}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3">
                    <Panel className="px-3.5 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Workload</p>
                      <p className="tnum mt-1 font-display text-lg font-bold text-tx-100">{minutesLabel(Math.round(assessment.workloadRemainingHours * 60))}</p>
                    </Panel>
                    <Panel className="px-3.5 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Pace capacity</p>
                      <p className="tnum mt-1 font-display text-lg font-bold text-tx-100">{minutesLabel(Math.round(assessment.availableHours * 60))}</p>
                    </Panel>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Dependency */}
      {blockedBy ? (
        <motion.div variants={rise}>
          <Card className="overflow-hidden border-warn-500/30">
            <CardHeader
              eyebrow={<><Link2 className="h-3 w-3" aria-hidden /> Dependency Blocked</>}
              title="Waiting on another boss"
            />
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-tx-400">
                This deadline is locked until <span className="font-semibold text-tx-200">“{blockedBy.title}”</span> clears.
              </p>
              <Button variant="secondary" style="outline" size="sm" onClick={() => navigate(`/deadline/${blockedBy.id}`)}>
                <Link2 className="h-3.5 w-3.5" aria-hidden /> Open dependency
              </Button>
            </CardBody>
          </Card>
        </motion.div>
      ) : null}

      {/* Milestones */}
      <motion.div variants={rise}>
        <Card>
          <CardHeader
            eyebrow={<><Swords className="h-3 w-3" aria-hidden /> Milestone Orbit</>}
            title="Defeat milestones to drop boss HP"
            aside={<Badge tone={boss <= 40 ? 'crit' : 'cmd'}>{milestones.filter((m) => m.done).length}/{milestones.length} down</Badge>}
          />
          <CardBody className="space-y-2 pt-3">
            {milestones.map((m, i) => <MilestoneRow key={m.id} m={m} index={i} />)}
          </CardBody>
        </Card>
      </motion.div>

      {/* Tasks */}
      <motion.div variants={rise}>
        <Card>
          <CardHeader
            eyebrow={<><CalendarClock className="h-3 w-3" aria-hidden /> Task List</>}
            title="Operations"
            aside={missions.length > 0 ? <Badge tone="cmd">{missions.filter((x) => x.status === 'available').length} missions ready</Badge> : undefined}
          />
          <CardBody className="space-y-2 pt-3">
            {tasks.map((t) => <TaskRow key={t.id} task={t} mission={missions.find((m) => m.taskId === t.id)} onLaunch={launchMission} />)}
            {tasks.length === 0 ? (
              <EmptyState title="NO OPERATIONS" body="Add tasks to this deadline to spawn missions." />
            ) : null}
          </CardBody>
        </Card>
      </motion.div>

      {/* Advisor */}
      <motion.div variants={rise}>
        <Card className="overflow-hidden border-command-500/20">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-command-300/80">Smart Assistant</p>
              <p className="mt-1 text-sm text-tx-400">Your plan slipped? Let the advisor rebuild the schedule around this deadline.</p>
            </div>
            <Button variant="primary" style="outline" size="sm"
              onClick={() => propose.mutate(tasks.find((t) => t.status !== 'done')?.title ?? deadline.title, { onSuccess: () => setReplanOpen(true) })}>
              Re-plan around this
            </Button>
          </CardBody>
        </Card>
      </motion.div>

      {/* Replan modal */}
      {data.replan ? (
        <ReplanModal proposal={data.replan} open={replanOpen} onClose={() => setReplanOpen(false)} />
      ) : null}
    </motion.div>
  )
}

function MilestoneRow({ m, index }: { m: Milestone; index: number }) {
  return (
    <motion.div
      variants={rise}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.04 }}
      className={cn(
        'rounded-lg border px-3.5 py-2.5',
        m.done ? 'border-safe-500/20 bg-safe-500/[0.05]' : 'border-line-soft bg-ink-900/50',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', m.done ? 'border-safe-500 bg-safe-500 text-ink-950' : 'border-tx-600 text-transparent')}>
          {m.done ? <Check className="h-3 w-3" aria-hidden /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold text-tx-200', m.done && 'line-through text-tx-500')}>{m.name}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-tx-500">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden /> -{m.bossDamage}% HP</span>
            <span className="text-xp-500">+{m.xpReward} XP</span>
          </div>
        </div>
        <ProgressBar value={m.progress} tone={m.done ? 'safe' : 'cmd'} height="h-1" className="w-16" animated={false} />
      </div>
    </motion.div>
  )
}

function TaskRow({ task, mission, onLaunch }: { task: Task; mission?: { id: string; brief: string; estimatedMinutes: number }; onLaunch: (missionId: string) => void }) {
  const done = task.status === 'done'
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-3.5 py-2.5', done ? 'border-line-soft bg-ink-900/30' : 'border-line-soft bg-ink-900/50')}>
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border', done ? 'border-safe-500 bg-safe-500 text-ink-950' : 'border-tx-600')}>
        {done ? <Check className="h-3 w-3" aria-hidden /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold text-tx-200', done && 'line-through text-tx-500')}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-tx-500">
          <span>{minutesLabel(task.estimatedMinutes)}</span>
          {task.criticalPath ? <Badge tone="crit">critical</Badge> : null}
          {task.dependsOn ? <span className="inline-flex items-center gap-1 text-warn-500"><Link2 className="h-3 w-3" aria-hidden /> needs upstream</span> : null}
        </div>
      </div>
      {mission && !done ? (
        <Button variant="primary" style="outline" size="sm" onClick={() => onLaunch(mission.id)}>
          <Swords className="h-3.5 w-3.5" aria-hidden /> Start
        </Button>
      ) : done ? (
        <Badge tone="safe">Done</Badge>
      ) : null}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-24 animate-pulse rounded bg-ink-700" />
      <div className="h-10 w-72 animate-pulse rounded bg-ink-700" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl bg-ink-800/80" />
        <div className="h-56 animate-pulse rounded-xl bg-ink-800/80" />
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-ink-800/80" />
    </div>
  )
}