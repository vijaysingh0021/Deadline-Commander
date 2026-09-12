/* ─────────────────────────────────────────────────────────
   Deadline Commander · Achievements
   Medals, not confetti. Every one is earned and shown with
   its progress toward unlock.
   ───────────────────────────────────────────────────────── */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Trophy, Lock, Check, Star } from 'lucide-react'
import { useCommand } from '@/hooks/useCommand'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { cn } from '@/utils'

const ICONS: Record<string, typeof Trophy> = {
  flag: Trophy, swords: Trophy, timer: Trophy, flame: Trophy,
  crosshair: Trophy, brain: Trophy,
}

export function AchievementsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCommand()

  if (isLoading) return <AchSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const achs = data.snapshot.achievements
  const unlocked = achs.filter((a) => a.unlocked).length

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Hall of Fame"
          title="Achievements"
          subtitle="Earned by real behavior — completing missions, breaking milestones, protecting streaks."
          action={<Badge tone="gold">{unlocked}/{achs.length} unlocked</Badge>}
        />
      </motion.div>

      <motion.div variants={rise} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achs.map((a) => {
          const Icon = ICONS[a.icon] ?? Trophy
          return (
            <Card key={a.id} className={cn(a.unlocked && 'overflow-hidden')}>
              {a.unlocked ? <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold-500 to-gold-400/60" /> : null}
              <CardBody className="space-y-3 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <span className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                    a.unlocked ? 'border-gold-400/40 bg-gold-500/10 text-gold-400' : 'border-line bg-ink-800 text-tx-500',
                  )}>
                    {a.unlocked ? <Icon className="h-4.5 w-4.5" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                  </span>
                  <span className="text-right">
                    <p className={cn('font-display text-sm font-bold tracking-tight', a.unlocked ? 'text-gold-400' : 'text-tx-300')}>{a.name}</p>
                    {a.unlockedAt ? (
                      <p className="mt-0.5 text-[11px] text-tx-500">
                        Earned {new Date(a.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    ) : null}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-tx-500">{a.description}</p>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-tx-500">
                    <span>{a.unlocked ? <span className="inline-flex items-center gap-1 text-safe-500"><Check className="h-3 w-3" aria-hidden /> Unlocked</span> : 'Progress'}</span>
                    <span className="tnum">{a.progressNow}/{a.progressTarget}</span>
                  </div>
                  <ProgressBar value={a.progress} tone={a.unlocked ? 'gold' : 'cmd'} height="h-1.5" className="mt-1" animated={false} />
                </div>

                {a.unlocked ? (
                  <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-400">
                    <Star className="h-3 w-3" aria-hidden /> Medal pinned
                  </p>
                ) : (
                  <p className="text-[11px] text-tx-600">{a.progressNow}/{a.progressTarget} toward this medal</p>
                )}
              </CardBody>
            </Card>
          )
        })}
      </motion.div>

      {achs.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-5 w-5" aria-hidden />}
          title="AWARDS CASE EMPTY"
          body="Complete your first mission to earn your first medal."
          action={<Button variant="primary" onClick={() => navigate('/missions')}>Open Missions</Button>}
        />
      ) : null}
    </motion.div>
  )
}

function AchSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl bg-ink-800/80" />
        ))}
      </div>
    </div>
  )
}