import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, Flame } from 'lucide-react'
import type { Deadline, Milestone, RiskAssessment } from '@/types'
import { RiskBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { riskMeta, RISK_LADDER } from '@/utils/risk'
import { duePhrase, minutesLabel } from '@/utils'
import { cn } from '@/utils'

export interface RadarEntry {
  deadline: Deadline
  assessment?: RiskAssessment
  boss: number
  milestone?: Milestone
  blockedBy?: Deadline
}

/**
 * One entry on the Deadline Radar. Every danger is made readable:
 * label + score + workload vs available + why. Sorted severity-first by the radar.
 */
export function DeadlineCard({ entry, rank }: { entry: RadarEntry; rank: number }) {
  const { deadline, assessment, boss, milestone, blockedBy } = entry
  const meta = assessment ? riskMeta(assessment.level) : riskMeta('SAFE')
  const dangerIdx = assessment ? RISK_LADDER.indexOf(assessment.level) : 0

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: rank * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/deadline/${deadline.id}`}
        className={cn(
          'group relative block overflow-hidden rounded-xl border p-4 transition-colors sm:p-5',
          dangerIdx >= 3
            ? 'border-crit-500/40 bg-crit-500/[0.045] hover:border-crit-500/70'
            : dangerIdx === 2
              ? 'border-high-500/30 bg-high-500/[0.04] hover:border-high-500/60'
              : dangerIdx === 1
                ? 'border-warn-500/25 bg-ink-800/80 hover:border-warn-500/50'
                : 'border-line-soft bg-ink-800/80 hover:border-line',
        )}
      >
        {/* severity ribbon */}
        {dangerIdx >= 2 ? (
          <span aria-hidden className={cn('absolute inset-y-0 left-0 w-[3px]', meta.solid, meta.glow)} />
        ) : null}

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="max-w-full truncate text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">{deadline.subject}</p>
              {dangerIdx >= 3 ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-crit-500/20 bg-crit-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-crit-500">
                  <Flame className="h-2.5 w-2.5" aria-hidden /> Urgent
                </span>
              ) : null}
            </div>
            <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-tight tracking-tight text-tx-100">{deadline.title}</h3>
          </div>
          {assessment ? <RiskBadge level={assessment.level} className="mt-0.5 shrink-0" /> : null}
        </div>

        {/* Boss HP + progress */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-tx-500">
            <span>Boss health</span>
            <span className="tnum text-tx-400">{Math.round(boss)}%</span>
          </div>
          <ProgressBar value={boss} tone={dangerIdx >= 3 ? 'crit' : dangerIdx >= 1 ? 'warn' : 'cmd'} height="h-1.5" className="mt-1" />
        </div>

        {/* Explanation — the "why" */}
        {assessment ? (
          <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-md border border-line-soft bg-ink-900/60 px-2.5 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Work</p>
              <p className="tnum mt-0.5 font-semibold text-tx-200">{minutesLabel(assessment.workloadRemainingHours * 60)}</p>
            </div>
            <div className="rounded-md border border-line-soft bg-ink-900/60 px-2.5 py-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Available</p>
              <p className="tnum mt-0.5 font-semibold text-tx-200">{minutesLabel(assessment.availableHours * 60)}</p>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 rounded-md border border-line-soft bg-ink-900/60 px-2.5 py-1.5 sm:col-span-1">
              <Clock className="h-3 w-3 shrink-0 text-tx-500" aria-hidden />
              <p className="tnum font-semibold text-tx-200">{duePhrase(deadline.dueDate)}</p>
            </div>
          </div>
        ) : null}

        {/* block reason */}
        {blockedBy ? (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-warn-500">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Waiting on “{blockedBy.title}”
          </p>
        ) : null}
        {milestone && !milestone.done ? (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-tx-500">
            <span className="h-1.5 w-1.5 rounded-full bg-command-500" aria-hidden />
            Next milestone: <span className="font-semibold text-tx-300">{milestone.name}</span>
          </p>
        ) : null}

        {assessment ? (
          <p className="mt-3 border-t border-line-soft pt-2.5 text-xs leading-relaxed text-tx-500">{assessment.why}</p>
        ) : null}
      </Link>
    </motion.article>
  )
}
