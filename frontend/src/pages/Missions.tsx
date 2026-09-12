/* ─────────────────────────────────────────────────────────
   Deadline Commander · Missions
   The arsenal — every open task is a mission you can launch.
   ───────────────────────────────────────────────────────── */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Swords, Play, Zap, Clock } from 'lucide-react'
import { useCommand, useSetMissionStatus } from '@/hooks/useCommand'
import { useUi } from '@/stores/ui'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge, RiskBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { cn, minutesLabel, duePhrase } from '@/utils'
import type { Mission } from '@/types'

export function MissionsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCommand()
  const setStatus = useSetMissionStatus()
  const setFocus = useUi((s) => s.setFocus)

  const groups = useMemo(() => {
    if (!data) return []
    return data.snapshot.deadlines
      .map((dl) => {
        const missions = data.snapshot.missions.filter((m) => m.deadlineId === dl.id)
        return { deadline: dl, missions, assessment: data.riskByDeadline.get(dl.id) }
      })
      .filter((g) => g.missions.length > 0)
      .sort((a, b) => (b.assessment?.score ?? 0) - (a.assessment?.score ?? 0))
  }, [data])

  if (isLoading) return <MissionsSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const { missions } = data.snapshot
  const launched = missions.find((m) => m.status === 'in_progress' || m.status === 'paused')

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Mission Control"
          title="Missions"
          subtitle="Each open task is a battle. Launch a mission to enter focus mode — completing it earns XP, attribute gains and streak."
          action={
            launched ? (
              <Badge tone="cmd" dot>1 in progress</Badge>
            ) : undefined
          }
        />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {groups.map(({ deadline: dl, missions: mss, assessment }) => (
          <motion.div key={dl.id} variants={rise} className="lg:col-span-3">
            <Card className="relative overflow-hidden">
              <CardBody className="pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className="mark-action font-display text-base font-bold tracking-tight text-tx-100"
                    onClick={() => navigate(`/deadline/${dl.id}`)}
                    role="link"
                    aria-label={`Open ${dl.title}`}
                  >
                    {dl.title}
                  </h3>
                  {assessment && <RiskBadge level={assessment.level} />}
                  <Badge tone="neutral">{duePhrase(dl.dueDate)}</Badge>
                </div>
                <p className="mt-1 text-xs text-tx-500">{dl.blurb}</p>

                <ul className="mt-4 space-y-2">
                  {mss.map((m) => (
                    <MissionRow
                      key={m.id}
                      mission={m}
                      onLaunch={() => {
                        setStatus.mutate({ missionId: m.id, status: 'in_progress' })
                        setFocus({ phase: 'running', missionId: m.id })
                      }}
                    />
                  ))}
                </ul>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Swords className="h-5 w-5" aria-hidden />}
          title="NO MISSIONS QUEUED"
          body="Every open task has been cleared. Create a deadline to spawn new missions."
          action={<Button variant="primary" onClick={() => navigate('/deadlines')}>Open Deadlines</Button>}
        />
      ) : null}
    </motion.div>
  )
}

function MissionRow({ mission, onLaunch }: { mission: Mission; onLaunch: () => void }) {
  const launched = mission.status === 'in_progress' || mission.status === 'paused'
  const completed = mission.status === 'completed'
  const elite = mission.xpReward >= 110
  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors',
        launched ? 'border-command-500/40 bg-command-500/[0.06] shadow-glow' : elite ? 'border-gold-400/25 bg-gold-500/[0.035]' : 'border-line-soft bg-ink-900/50',
        completed && 'opacity-70',
      )}
    >
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
        launched ? 'border-command-500/40 bg-command-500/15 text-command-300' : 'border-line bg-ink-800 text-tx-500',
      )}>
        {launched ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Swords className="h-3.5 w-3.5" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold text-tx-200', completed && 'line-through')}>{mission.brief}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-tx-500">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{minutesLabel(mission.estimatedMinutes)}</span>
          <span className="inline-flex items-center gap-1 text-xp-500"><Zap className="h-3 w-3" aria-hidden />+{mission.xpReward} XP</span>
          {elite ? <span className="rounded border border-gold-400/25 bg-gold-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gold-400">ELITE</span> : null}
        </div>
      </div>

      {launched ? (
        <Button variant="primary" size="sm" onClick={onLaunch}>
          <Play className="h-3.5 w-3.5" aria-hidden /> Resume
        </Button>
      ) : completed ? (
        <Badge tone="safe">Done</Badge>
      ) : (
        <Button variant="primary" style="outline" size="sm" onClick={onLaunch}>
          <Play className="h-3.5 w-3.5" aria-hidden /> Start
        </Button>
      )}
    </li>
  )
}

function MissionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-line-soft bg-ink-800/80 p-4">
            <div className="h-4 w-40 animate-pulse rounded bg-ink-700" />
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-14 animate-pulse rounded-lg bg-ink-700/60" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
