import { type ReactNode } from 'react'
import { cn } from '@/utils'

/** A decision-oriented stat: labeled value + optional trend + explanation. */
export function Stat({
  label,
  value,
  unit,
  hint,
  tone = 'tx-100',
  valueClassName,
  prefix,
}: {
  label: string
  value: ReactNode
  unit?: string
  hint?: ReactNode
  tone?: 'tx-100' | 'cmd' | 'xp' | 'crit' | 'gold'
  valueClassName?: string
  prefix?: ReactNode
}) {
  const tones = {
    'tx-100': 'text-tx-100',
    cmd: 'text-command-300',
    xp: 'text-xp-500',
    crit: 'text-crit-500',
    gold: 'text-gold-400',
  }
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-tx-500">{label}</div>
      <div className={cn('mt-0.5 flex items-baseline gap-1', tones[tone])}>
        {prefix ? <span className="text-sm opacity-70">{prefix}</span> : null}
        <span className={cn('tnum font-display text-2xl font-bold leading-none tracking-tight', valueClassName)}>{value}</span>
        {unit ? <span className="text-xs text-tx-500">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-1 text-xs leading-relaxed text-tx-500">{hint}</div> : null}
    </div>
  )
}