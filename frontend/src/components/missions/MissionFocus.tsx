import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, Check, X, ChevronDown } from 'lucide-react'
import { useCommand, useSetMissionStatus } from '@/hooks/useCommand'
import { useUi } from '@/stores/ui'
import { useNow, useHotkey } from '@/hooks/useMediaQuery'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { fmtDuration, minutesLabel, duePhrase } from '@/utils'
import type { Mission } from '@/types'

function useSessionElapsed(mission: Mission | undefined, running: boolean) {
  const now = useNow(1000)
  // anchor when running
  const [anchor, setAnchor] = useState<{ t: number; baseMs: number } | null>(null)
  useEffect(() => {
    if (running) setAnchor({ t: Date.now(), baseMs: (mission?.elapsedSessionSeconds ?? 0) * 1000 })
    else setAnchor(null)
  }, [running, mission?.id])
  if (!mission) return 0
  if (!running || !anchor) return mission.elapsedSessionSeconds
  return mission.elapsedSessionSeconds + Math.max(0, (now - anchor.t) / 1000)
}

export function MissionFocus({ missionId, onComplete, onExit }: { missionId: string; onComplete: () => void; onExit: () => void }) {
  const { data } = useCommand()
  const setStatus = useSetMissionStatus()
  const setFocus = useUi((s) => s.setFocus)
  const [status, setStatusLocal] = useState<'running' | 'paused'>('running')

  const mission = useMemo(() => data?.snapshot.missions.find((m) => m.id === missionId), [data, missionId])
  const deadline = data?.snapshot.deadlines.find((d) => d.id === mission?.deadlineId)
  const assessment = mission && deadline ? data?.riskByDeadline.get(deadline.id) : undefined
  const task = data?.snapshot.tasks.find((t) => t.id === mission?.taskId)

  // checklist = tasks of the same milestone (dependency chain)
  const checklist = useMemo(
    () =>
      data?.snapshot.tasks
        .filter((t) => t.deadlineId === mission?.deadlineId && t.milestoneId === task?.milestoneId)
        .sort((a, b) => Number(b.status === 'done') - Number(a.status === 'done')) ?? [],
    [data, mission, task],
  )

  const elapsed = useSessionElapsed(mission, status === 'running')
  const remaining = Math.max(0, (mission?.estimatedMinutes ?? 0) * 60 - elapsed)
  const progress = mission && mission.estimatedMinutes > 0 ? Math.min(100, (elapsed / (mission.estimatedMinutes * 60)) * 100) : 0

  const togglePause = () => {
    if (!mission) return
    const next = status === 'running' ? 'paused' : 'in_progress'
    setStatusLocal(next === 'in_progress' ? 'running' : 'paused')
    setStatus.mutate({ missionId: mission.id, status: next as 'in_progress' | 'paused' })
    setFocus(next === 'paused' ? { phase: 'paused', missionId } : { phase: 'running', missionId })
  }

  // space toggles pause
  useHotkey(' ', () => {
    if (status === 'running') togglePause()
  })
  useHotkey('Escape', onExit)

  if (!mission) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink-950">
      {/* ambient gradient */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[44vh] bg-gradient-to-b from-command-500/[0.07] via-transparent to-transparent" />
      <div aria-hidden className="app-grid pointer-events-none absolute inset-0 opacity-60" />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-line-soft px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-tx-500">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-command-500" aria-hidden />
          Focus Mission · {status === 'running' ? 'Engaged' : 'Paused'}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-md border border-xp-500/30 bg-xp-500/10 px-2.5 py-1 text-xs font-bold text-xp-500 sm:inline">
            +{mission.xpReward} XP
          </span>
          {deadline && assessment ? (
            <span className="hidden text-xs text-tx-500 sm:inline">{duePhrase(deadline.dueDate)}</span>
          ) : null}
          <button
            aria-label="Minimize mission"
            onClick={onExit}
            className="rounded-md p-1.5 text-tx-500 transition-colors hover:bg-ink-800 hover:text-tx-100"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* center stage */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8 sm:gap-10">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-command-300/80">Current Mission</p>
          <h1 className="mx-auto mt-2 max-w-2xl font-display text-2xl font-bold tracking-tight text-tx-100 sm:text-4xl">
            {mission.brief}
          </h1>
          {deadline ? (
            <p className="mt-2 text-sm text-tx-500">
              {deadline.title}
              {assessment ? (
                <>
                  {' · '}
                  <span className="font-semibold text-tx-400">{assessment.level}</span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        {/* THE timer */}
        <div className="relative">
          <motion.div
            key={status}
            initial={{ opacity: 0.4, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="tnum font-mono text-6xl font-bold leading-none tracking-tight text-tx-100 sm:text-8xl">
              {fmtDuration(remaining)}
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.28em] text-tx-500">
              {status === 'running' ? 'remaining' : 'paused'}
            </p>
          </motion.div>
        </div>

        {/* progress + checklist */}
        <div className="w-full max-w-xl">
          <ProgressBar value={progress} tone="cmd" height="h-2" label={`${Math.round(progress)}% · ${minutesLabel(mission.estimatedMinutes)} estimate`} showLabel />
          <div className="mt-5 grid gap-1.5 sm:grid-cols-2">
            {checklist.map((t) => {
              const done = t.status === 'done'
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                    done ? 'border-safe-500/20 bg-safe-500/[0.05] text-tx-500' : 'border-line-soft bg-ink-850 text-tx-200'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                      done ? 'border-safe-500 bg-safe-500 text-ink-950' : 'border-tx-600'
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" aria-hidden /> : null}
                  </span>
                  <span className={done ? 'line-through' : ''}>{t.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* actions */}
      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-3 border-t border-line-soft px-4 py-4 sm:gap-4 sm:py-5">
        <Button variant={status === 'running' ? 'secondary' : 'primary'} style="outline" size="lg" onClick={togglePause}>
          {status === 'running' ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {status === 'running' ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="primary" size="lg" onClick={onComplete} className="px-10">
          <Check className="h-4 w-4" aria-hidden />
          Complete
        </Button>
        <Button variant="ghost" size="lg" onClick={onExit}>
          <X className="h-4 w-4" aria-hidden /> Abandon
        </Button>
        <p className="hidden text-[11px] text-tx-600 lg:block">Space = pause · Esc = exit</p>
      </footer>
    </div>
  )
}
