/* ─────────────────────────────────────────────────────────
   Deadline Commander · Profile
   Your dossier: identity, rank, habits, and the demo reset.
   ───────────────────────────────────────────────────────── */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Coins, Flame, RotateCcw, Activity, Server } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCommand } from '@/hooks/useCommand'
import { resetDemo, isLiveMode } from '@/services/api'
import { keys } from '@/services/keys'
import { useToast } from '@/stores/toast'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader, CardBody, Panel } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Ring } from '@/components/ui/charts'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { cn } from '@/utils'
import type { AttributeMap } from '@/types'

export function ProfilePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  const { data, isLoading, isError, refetch } = useCommand()

  if (isLoading) return <ProfileSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const { profile, activity } = data.snapshot
  const xpPct = profile.xpToNext > 0 ? Math.round((profile.xp / profile.xpToNext) * 100) : 0
  const live = isLiveMode()

  const handleReset = () => {
    resetDemo()
    qc.invalidateQueries({ queryKey: keys.derived })
    qc.invalidateQueries({ queryKey: keys.activity })
    toast({ kind: 'info', title: 'DEMO RESET', detail: 'Fresh start, Commander.' })
  }

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Dossier"
          title={profile.name}
          subtitle={`${profile.title} · enlisted ${new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
          action={<Badge tone={live ? 'cmd' : 'neutral'} dot>{live ? 'Live API' : 'Demo mode'}</Badge>}
        />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Rank card */}
        <motion.div variants={rise} className="lg:col-span-1">
          <Card>
            <CardBody className="flex flex-col items-center pt-6 text-center">
              <Ring value={xpPct} size={112} stroke={9} tone="#2de2c3">
                <span className="font-display mt-2 text-xl font-bold text-command-300">LV.{profile.level}</span>
              </Ring>
              <h3 className="mt-4 font-display text-lg font-bold text-tx-100">{profile.title}</h3>
              <p className="tnum mt-1 text-xs text-tx-500">{profile.xp}/{profile.xpToNext} XP</p>
              <ProgressBar value={xpPct} tone="xp" height="h-1.5" className="mt-3" />

              <div className="mt-5 grid w-full grid-cols-2 gap-2.5">
                <Panel className="flex flex-col items-center px-2 py-3">
                  <Flame className="h-4 w-4 text-high-500" aria-hidden />
                  <p className="tnum mt-1 font-display text-lg font-bold text-tx-100">{profile.streak}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">day streak</p>
                </Panel>
                <Panel className="flex flex-col items-center px-2 py-3">
                  <Coins className="h-4 w-4 text-gold-400" aria-hidden />
                  <p className="tnum mt-1 font-display text-lg font-bold text-tx-100">{profile.gold}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">gold</p>
                </Panel>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Attributes summary */}
        <motion.div variants={rise} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader eyebrow={<><ShieldCheck className="h-3 w-3" aria-hidden /> Attributes</>} title="Trained stats" />
            <CardBody className="space-y-3 pt-2">
              {(Object.keys(profile.attributes) as (keyof AttributeMap)[]).map((k) => (
                <div key={k}>
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="uppercase tracking-wider text-tx-400">{k}</span>
                    <span className="tnum text-tx-300">{profile.attributes[k]}</span>
                  </div>
                  <ProgressBar value={profile.attributes[k]} tone="cmd" height="h-1.5" className="mt-1" animated={false} />
                </div>
              ))}
              <Button variant="secondary" style="outline" size="sm" className="w-full mt-1" onClick={() => navigate('/character')}>
                Full character sheet
              </Button>
            </CardBody>
          </Card>
        </motion.div>

        {/* Activity feed */}
        <motion.div variants={rise} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader eyebrow={<><Activity className="h-3 w-3" aria-hidden /> Activity</>} title="Recent events" />
            <CardBody className="pt-2">
              <ul className="space-y-2.5">
                {(activity ?? []).slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 rounded-lg border border-line-soft bg-ink-900/50 px-3 py-2">
                    <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', dotTone(e.kind))} aria-hidden />
                    <div className="min-w-0">
                      {e.deltaXp ? <p className="tnum text-[10px] font-bold text-xp-500">+{e.deltaXp} XP</p> : null}
                      <p className="truncate text-[13px] font-semibold text-tx-200">{e.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-tx-500">{e.detail}</p>
                    </div>
                  </li>
                ))}
                {(activity ?? []).length === 0 ? (
                  <li className="text-sm text-tx-500">No activity yet. Complete a mission to make history.</li>
                ) : null}
              </ul>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Danger zone */}
      <motion.div variants={rise}>
        <Card className="overflow-hidden border-line">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tx-500">
                <Server className="mr-1 inline h-3 w-3" aria-hidden />
                {live ? 'Connected to live API' : 'Local demo database'}
              </p>
              <p className="mt-1 text-sm text-tx-500">
                {live
                  ? 'Data flows through VITE_API_URL.'
                  : 'Your progress is stored locally in this browser. Reset to restore the seed state.'}
              </p>
            </div>
            {!live ? (
              <Button variant="danger" style="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Reset demo
              </Button>
            ) : null}
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function dotTone(kind: string): string {
  switch (kind) {
    case 'mission': return 'bg-command-500'
    case 'milestone': return 'bg-crit-500'
    case 'achievement': return 'bg-gold-400'
    case 'level': return 'bg-xp-500'
    case 'reward': return 'bg-gold-400'
    case 'plan': return 'bg-warn-500'
    case 'goal': return 'bg-violet-400'
    case 'profile': return 'bg-blue-400'
    default: return 'bg-tx-500'
  }
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl bg-ink-800/80" />
        <div className="h-80 animate-pulse rounded-xl bg-ink-800/80" />
        <div className="h-80 animate-pulse rounded-xl bg-ink-800/80" />
      </div>
    </div>
  )
}