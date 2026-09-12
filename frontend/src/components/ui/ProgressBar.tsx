import { motion } from 'framer-motion'
import { cn } from '@/utils'

export type BarTone = 'cmd' | 'xp' | 'crit' | 'high' | 'warn' | 'safe' | 'gold' | 'neutral'

const TONES: Record<BarTone, { track: string; fill: string }> = {
  cmd: { track: 'bg-command-500/10', fill: 'bg-command-500' },
  xp: { track: 'bg-xp-500/10', fill: 'bg-xp-500' },
  crit: { track: 'bg-crit-500/10', fill: 'bg-crit-500' },
  high: { track: 'bg-high-500/10', fill: 'bg-high-500' },
  warn: { track: 'bg-warn-500/10', fill: 'bg-warn-500' },
  safe: { track: 'bg-safe-500/10', fill: 'bg-safe-500' },
  gold: { track: 'bg-gold-500/10', fill: 'bg-gold-400' },
  neutral: { track: 'bg-ink-600/60', fill: 'bg-tx-300' },
}

export function ProgressBar({
  value,
  tone = 'cmd',
  className,
  height = 'h-1.5',
  showLabel,
  label,
  animated = true,
}: {
  value: number
  tone?: BarTone
  className?: string
  height?: string
  showLabel?: boolean
  label?: string
  animated?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const { track, fill } = TONES[tone]
  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Progress'}>
      <div className={cn('relative w-full overflow-hidden rounded-full', track, height)}>
        {animated ? (
          <motion.div
            className={cn('absolute inset-y-0 left-0 rounded-full', fill)}
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : (
          <div className={cn('h-full rounded-full', fill)} style={{ width: `${clamped}%` }} />
        )}
      </div>
      {showLabel ? (
        <div className="mt-1 flex items-center justify-between text-[11px] text-tx-500">
          <span>{label}</span>
          <span className="tnum text-tx-400">{Math.round(clamped)}%</span>
        </div>
      ) : null}
    </div>
  )
}

/** Thin segmented bar used for boss-health readouts. */
export function SegmentBar({ value, segments = 20, tone = 'crit', className }: { value: number; segments?: number; tone?: BarTone; className?: string }) {
  const filled = Math.round((value / 100) * segments)
  const { fill } = TONES[tone]
  return (
    <div className={cn('flex gap-[3px]', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      {Array.from({ length: segments }).map((_, i) => (
        <span key={i} className={cn('h-2 flex-1 rounded-[2px]', i < filled ? fill : 'bg-ink-600/50')} />
      ))}
    </div>
  )
}