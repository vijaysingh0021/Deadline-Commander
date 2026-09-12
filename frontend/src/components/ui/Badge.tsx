import { type ReactNode } from 'react'
import { cn } from '@/utils'
import { RISK_META, type RiskMeta } from '@/utils/risk'
import type { RiskLevel } from '@/types'

export type BadgeTone = 'cmd' | 'neutral' | 'gold' | 'violet' | 'blue' | 'safe' | 'warn' | 'high' | 'crit' | 'xp'

const TONES: Record<BadgeTone, string> = {
  cmd: 'bg-command-500/10 text-command-300 border-command-500/30',
  neutral: 'bg-ink-700/60 text-tx-400 border-line',
  gold: 'bg-gold-500/10 text-gold-400 border-gold-500/30',
  violet: 'bg-violet-400/10 text-violet-400 border-violet-400/30',
  blue: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
  safe: 'bg-safe-500/10 text-safe-500 border-safe-500/30',
  warn: 'bg-warn-500/10 text-warn-500 border-warn-500/30',
  high: 'bg-high-500/10 text-high-500 border-high-500/30',
  crit: 'bg-crit-500/10 text-crit-500 border-crit-500/30',
  xp: 'bg-xp-500/10 text-xp-500 border-xp-500/30',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  dot,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', 'bg-current')} aria-hidden /> : null}
      {children}
    </span>
  )
}

/** Risk chip — label + glyph + tone. Never color alone. */
export function RiskBadge({ level, className, size = 'sm' }: { level: RiskLevel; className?: string; size?: 'sm' | 'md' }) {
  const meta = RISK_META[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-bold tracking-wide',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.chipBg,
        {
          'border-crit-500/40 text-crit-500': level === 'CRITICAL',
          'border-high-500/40 text-high-500': level === 'HIGH',
          'border-warn-500/40 text-warn-500': level === 'WARNING',
          'border-safe-500/40 text-safe-500': level === 'SAFE',
        },
        className,
      )}
      data-risk={level}
    >
      <span aria-hidden className="text-[0.9em] leading-none">{meta.glyph}</span>
      {meta.label}
    </span>
  )
}

export function riskMetaOf(level: RiskLevel): RiskMeta {
  return RISK_META[level]
}