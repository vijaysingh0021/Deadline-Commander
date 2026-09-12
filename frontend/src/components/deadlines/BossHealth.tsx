import { motion } from 'framer-motion'
import { Swords } from 'lucide-react'
import type { Deadline, Milestone } from '@/types'
import { SegmentBar } from '@/components/ui/ProgressBar'
import { bossNextMilestone } from '@/services/brain'
import { cn } from '@/utils'

/**
 * Boss project readout. Eloquent, not cartoonish: a segmented health bar,
 * milestone orbit, and the next strike target.
 */
export function BossHealth({
  deadline,
  milestones,
  health,
  compact = false,
}: {
  deadline: Deadline
  milestones: Milestone[]
  health: number
  compact?: boolean
}) {
  const next = bossNextMilestone(deadline.id, milestones)
  const defeated = milestones.filter((m) => m.deadlineId === deadline.id && m.done).length
  const danger = health <= 40

  return (
    <div className="rounded-xl border border-line-soft bg-ink-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">
          <Swords className="h-3.5 w-3.5 text-crit-500" aria-hidden />
          Boss Project · {deadline.title}
        </div>
        <div className="text-[10px] text-tx-500">
          {defeated} milestone{defeated === 1 ? '' : 's'} defeated
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={cn('font-display text-2xl font-bold tracking-tight', danger ? 'text-crit-500' : 'text-command-300')}>
          <motion.span key={Math.round(health)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            {Math.round(health)}%
          </motion.span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-tx-500">HP</span>
      </div>

      <SegmentBar value={health} segments={compact ? 14 : 24} tone={danger ? 'crit' : health <= 60 ? 'high' : 'cmd'} className="mt-2" />

      {next ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-command-500/20 bg-command-500/[0.05] px-3 py-2">
          <span className="text-xs text-tx-400">
            Next strike: <span className="font-semibold text-tx-200">{next.name}</span>
          </span>
          <span className="text-[11px] font-bold text-command-300">−{next.bossDamage}% HP</span>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-xp-500/25 bg-xp-500/[0.06] px-3 py-2 text-xs font-semibold text-xp-500">
          BOSS DEFEATED — all milestones cleared.
        </div>
      )}
    </div>
  )
}