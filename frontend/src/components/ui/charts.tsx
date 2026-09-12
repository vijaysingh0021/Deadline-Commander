import { type ReactNode } from 'react'
import { cn } from '@/utils'

/* Small original SVG chart primitives — no charting dependency. */

export interface SeriesPoint {
  label: string
  value: number
}

/** Segmented progress ring — a stat that reads like an instrument. */
export function Ring({
  value,
  size = 84,
  stroke = 7,
  tone = '#2de2c3',
  label,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: string
  label?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const filled = Math.max(0, Math.min(100, value))
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${Math.round(filled)}%` : undefined}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (filled / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${tone}55)` }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-display text-[0.95rem] font-bold text-tx-100">{children ?? `${Math.round(filled)}%`}</span>
      </span>
    </div>
  )
}

/** Sparkline — thin trend with a soft area fill. */
export function Sparkline({
  data,
  width = 140,
  height = 40,
  tone = '#2de2c3',
  max,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  tone?: string
  max?: number
  className?: string
}) {
  const top = max ?? Math.max(...data, 1)
  const step = width / Math.max(data.length - 1, 1)
  const pts = data.map((v, i) => [i * step, height - (v / top) * (height - 4) - 2])
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const gid = `sp-${Math.round(width)}-${tone.replace('#', '')}-${data.length}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={tone} />
    </svg>
  )
}

/** Horizontal labelled bar row — clean, scannable, decision-oriented. */
export function BarRow({
  items,
  format = (v) => `${v}h`,
  tone = '#2de2c3',
  emphasize = 0,
}: {
  items: SeriesPoint[]
  format?: (v: number) => string
  tone?: string
  emphasize?: number // index to highlight
}) {
  const max = Math.max(...items.map((i) => i.value), 0.01)
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it, i) => (
        <div key={it.label} className="grid grid-cols-[2.6rem_1fr_3.25rem] items-center gap-2.5 sm:grid-cols-[3rem_1fr_3.5rem]">
          <span className="text-[11px] font-semibold tracking-wider text-tx-500">{it.label}</span>
          <div className="h-5 overflow-hidden rounded-[4px] bg-ink-700/50">
            <div
              className={cn('h-full rounded-[4px]', i === emphasize && 'opacity-100')}
              style={{
                width: `${Math.max((it.value / max) * 100, it.value > 0 ? 4 : 0)}%`,
                background: i === emphasize ? `linear-gradient(90deg, ${tone}, ${tone}99)` : `linear-gradient(90deg, ${tone}66, ${tone}33)`,
              }}
            />
          </div>
          <span className="tnum text-right text-[11px] text-tx-400">{format(it.value)}</span>
        </div>
      ))}
    </div>
  )
}

/** Two-series grouped bars — planned vs actual. */
export function CompareBars({
  items,
  plannedTone = '#6b7485',
  actualTone = '#2de2c3',
}: {
  items: { label: string; planned: number; actual: number }[]
  plannedTone?: string
  actualTone?: string
}) {
  const max = Math.max(...items.flatMap((i) => [i.planned, i.actual]), 0.01)
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <div key={it.label} className="grid grid-cols-[2.6rem_1fr] items-center gap-2.5 sm:grid-cols-[3rem_1fr]">
          <span className="text-[11px] font-semibold tracking-wider text-tx-500">{it.label}</span>
          <div className="flex h-4 gap-[3px]">
            <div
              className="h-full rounded-[3px]"
              style={{ width: `${(it.planned / max) * 100}%`, background: plannedTone, opacity: 0.5 }}
              title={`Planned ${it.planned}h`}
            />
            <div
              className="h-full rounded-[3px]"
              style={{ width: `${(it.actual / max) * 100}%`, background: actualTone }}
              title={`Actual ${it.actual}h`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Risk trend — tiny line with a stopping dot tinted by latest risk. */
export function RiskTrend({
  points,
  latestTone,
}: {
  points: SeriesPoint[]
  latestTone?: string
}) {
  const max = 100
  const w = points.length * 22
  const h = 56
  const step = w / Math.max(points.length - 1, 1)
  const pts = points.map((p, i) => [i * step, h - (p.value / max) * (h - 6)])
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={line} fill="none" stroke="rgba(242,78,62,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill={i === pts.length - 1 && latestTone ? latestTone : 'rgba(148,163,184,0.4)'} />
      ))}
    </svg>
  )
}