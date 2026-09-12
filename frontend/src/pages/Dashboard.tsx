/* ─────────────────────────────────────────────────────────
   Deadline Commander · Dashboard
   "What should I work on right now?"
   The command center. Everything descends from this screen.
   ───────────────────────────────────────────────────────── */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Swords, AlertTriangle, ArrowRight, Flame, Target,
  CalendarClock, TrendingUp, CheckCircle2,
} from 'lucide-react'
import { useCommand, useApplyNextAction } from '@/hooks/useCommand'
import { useUi } from '@/stores/ui'
import { useSetMissionStatus } from '@/hooks/useCommand'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, Panel } from '@/components/ui/Card'
import { Badge, RiskBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Ring } from '@/components/ui/charts'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { DeadlineRadar } from '@/components/deadlines/DeadlineRadar'
import { CampaignBoard } from '@/components/gamification/CampaignBoard'
import { BossArena } from '@/components/gamification/BossArena'
import { CampaignMap } from '@/components/gamification/CampaignMap'
import { rise, stagger } from '@/animations'
import { cn, duePhrase, minutesLabel } from '@/utils'
import { riskMeta } from '@/utils/risk'
import type { Deadline } from '@/types'
import { riskLevelForScore } from '@/services/brain'

/* ── Time-of-day greeting ─────────────────────────────────── */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Late night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Current mission card ─────────────────────────────────── */
function ActiveMissionCard({
  mission,
  deadline,
  riskScore,
  onStart,
}: {
  mission: { id: string; brief: string; estimatedMinutes: number }
  deadline?: Deadline
  riskScore: number
  onStart: () => void
}) {
  const risk = riskLevelForScore(riskScore)
  const meta = riskMeta(risk)
  const pct = deadline?.progress ?? 0

  return (
    <Card className="relative overflow-hidden">
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-[3px]', meta.solid, meta.glow)} />
      <CardHeader
        eyebrow={<><Swords className="h-3 w-3" aria-hidden /> Current Mission</>}
        title={mission.brief}
      />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={risk} size="md" />
          {deadline && <Badge tone="neutral" dot>{duePhrase(deadline.dueDate)}</Badge>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Panel className="px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Risk</p>
            <p className={cn('tnum mt-0.5 font-display text-xl font-bold', meta.text)}>{riskScore}%</p>
          </Panel>
          <Panel className="px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Est. Time</p>
            <p className="tnum mt-0.5 font-display text-xl font-bold text-tx-100">{minutesLabel(mission.estimatedMinutes)}</p>
          </Panel>
          <Panel className="px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Due</p>
            <p className="mt-0.5 font-display text-xl font-bold text-tx-100">{deadline ? duePhrase(deadline.dueDate) : '—'}</p>
          </Panel>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-tx-500">
            <span>Progress</span>
            <span className="tnum">{pct}%</span>
          </div>
          <ProgressBar value={pct} tone={riskScore >= 75 ? 'crit' : riskScore >= 50 ? 'warn' : 'cmd'} height="h-2" className="mt-1.5" />
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={onStart}>
          <Swords className="h-4 w-4" aria-hidden />
          START MISSION
        </Button>
      </CardBody>
    </Card>
  )
}

/* ── Main dashboard ─────────────────────────────────────────── */
export function DashboardPage() {
  const navigate = useNavigate()
  const setFocus = useUi((s) => s.setFocus)
  const { data, isLoading, isError, refetch } = useCommand()
  const applyNext = useApplyNextAction()
  const setStatus = useSetMissionStatus()

  const liveMission = useMemo(() => {
    if (!data) return null
    const { snapshot, riskByDeadline } = data
    const active = snapshot.missions.find((m) => m.status === 'in_progress' || m.status === 'paused')
      ?? snapshot.missions.find((m) => m.status === 'available')
    if (!active) return null
    const dl = snapshot.deadlines.find((d) => d.id === active.deadlineId)
    return { mission: active, deadline: dl, risk: dl ? riskByDeadline.get(dl.id) : undefined }
  }, [data])

  const startMission = (missionId: string) => {
    setStatus.mutate({ missionId, status: 'in_progress' })
    setFocus({ phase: 'running', missionId })
  }

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const { profile } = data.snapshot
  const xpPct = profile.xpToNext > 0 ? Math.round((profile.xp / profile.xpToNext) * 100) : 0
  const nextAction = data.nextAction
  const tasksDone = data.snapshot.tasks.filter((t) => t.status === 'done').length
  const activeDeadlines = data.snapshot.deadlines.filter((d) => d.progress < 100).length
  const planMissions = data.snapshot.plan.filter((b) => b.kind === 'mission').length

  const applyNextAction = () => {
    if (nextAction.moveMinutes && nextAction.sourceDeadline && nextAction.targetDeadline) {
      applyNext.mutate({ move: nextAction.moveMinutes, from: nextAction.sourceDeadline, to: nextAction.targetDeadline })
    }
  }

  return (
    <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-6">
      {/* ── Greeting + status ── */}
      <motion.div variants={rise}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-command-300/90">
              {greeting()}, Commander
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-tx-100 sm:text-4xl">
              {profile.name}
            </h1>
            <p className="mt-1.5 text-sm text-tx-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {profile.title}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Panel className="flex items-center gap-3 px-4 py-3">
              <Ring value={xpPct} size={56} stroke={5} tone="#2de2c3">
                <span className="font-display text-[11px] font-bold text-command-300">LV.{profile.level}</span>
              </Ring>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">Level {profile.level}</p>
                <p className="tnum text-xs text-tx-400">{profile.xp}/{profile.xpToNext} XP</p>
              </div>
            </Panel>

            <Panel className="flex items-center gap-2.5 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-high-500/15">
                <Flame className="h-4 w-4 text-high-500" aria-hidden />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">Streak</p>
                <p className="tnum font-display text-lg font-bold leading-none text-tx-100">{profile.streak}</p>
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-4 max-w-xl">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-tx-500">
            <span>Experience</span>
            <span className="tnum">{xpPct}% to next level</span>
          </div>
          <ProgressBar value={xpPct} tone="xp" height="h-1.5" className="mt-1" />
        </div>
      </motion.div>

      {/* ── Mission + radar ── */}
      <div className="grid gap-5 lg:grid-cols-5">
        <motion.div variants={rise} className="lg:col-span-3">
          {liveMission ? (
            <ActiveMissionCard
              mission={liveMission.mission}
              deadline={liveMission.deadline}
              riskScore={liveMission.risk?.score ?? 0}
              onStart={() => startMission(liveMission.mission.id)}
            />
          ) : (
            <Card className={cn('flex flex-col items-center justify-center gap-0 px-6 py-12 text-center')}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-ink-800 text-command-300/60">
                <Swords className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-tx-100">No Active Mission</h3>
              <p className="mt-1.5 max-w-[36ch] text-sm text-tx-500">
                Start a mission to focus on your highest-priority deadline.
              </p>
              <Button variant="primary" size="md" className="mt-5" onClick={() => navigate('/missions')}>
                <Target className="h-4 w-4" aria-hidden /> Browse Missions
              </Button>
            </Card>
          )}
        </motion.div>

        <motion.div variants={rise} className="lg:col-span-2">
          <DeadlineRadar derived={data} loading={false} />
        </motion.div>
      </div>

      <motion.div variants={rise}>
        <CampaignBoard
          profile={profile}
          deadlines={data.snapshot.deadlines}
          activity={data.snapshot.activity}
          achievements={data.snapshot.achievements}
        />
      </motion.div>

      <motion.div variants={rise}><BossArena derived={data} /></motion.div>

      <motion.div variants={rise}><CampaignMap deadlines={data.snapshot.deadlines} assessments={data.riskByDeadline} /></motion.div>

      {/* ── Next action + progress ── */}
      <div className="grid gap-5 md:grid-cols-3">
        <motion.div variants={rise}>
          <Card className="relative overflow-hidden h-full">
            <CardHeader
              eyebrow={<><Target className="h-3 w-3" aria-hidden /> Next Best Action</>}
              title="What to do now"
            />
            <CardBody className="space-y-3">
              <p className="text-sm leading-relaxed text-tx-300">{nextAction.text}</p>
              <Button
                variant="primary"
                style="outline"
                size="md"
                onClick={applyNextAction}
                disabled={!nextAction.moveMinutes || applyNext.isPending}
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
                {applyNext.isPending ? 'Executing…' : 'Execute'}
              </Button>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={rise}>
          <Card className="h-full">
            <CardHeader
              eyebrow={<><TrendingUp className="h-3 w-3" aria-hidden /> Overview</>}
              title="Performance"
            />
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Deadlines', value: data.snapshot.deadlines.length, icon: CalendarClock, tone: 'text-command-300' },
                  { label: 'Active', value: activeDeadlines, icon: AlertTriangle, tone: 'text-high-500' },
                  { label: 'Tasks done', value: tasksDone, icon: CheckCircle2, tone: 'text-safe-500' },
                  { label: 'Gold', value: profile.gold, icon: Target, tone: 'text-gold-400' },
                ].map((s) => (
                  <Panel key={s.label} className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <s.icon className={cn('h-3.5 w-3.5', s.tone)} aria-hidden />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-tx-500">{s.label}</span>
                    </div>
                    <p className="tnum mt-1 font-display text-xl font-bold leading-none text-tx-100">{s.value}</p>
                  </Panel>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={rise}>
          <Card className="h-full">
            <CardHeader
              eyebrow={<><Swords className="h-3 w-3" aria-hidden /> Plan Ready</>}
              title="Take command of today"
            />
            <CardBody className="flex h-full flex-col">
              <p className="text-sm leading-relaxed text-tx-500">
                {data.snapshot.plan.length > 0
                  ? `${data.snapshot.plan.length} blocks planned · ${planMissions} missions queued for today.`
                  : 'Your day has not been planned yet. Generate a plan to take command.'}
              </p>
              <div className="mt-auto pt-4">
                <Button variant="secondary" style="outline" size="sm" onClick={() => navigate('/planner')}>
                  Open Planner
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
