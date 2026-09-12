import { cn } from '@/utils'

export type StatusTone = 'ok' | 'warn' | 'danger' | 'info' | 'muted' | 'cmd'

/** Status indicator — always carries a textual label, color is reinforcement. */
export function StatusIndicator({
  tone,
  label,
  className,
  pulse = false,
}: {
  tone: StatusTone
  label: string
  className?: string
  pulse?: boolean
}) {
  const dot: Record<StatusTone, string> = {
    ok: 'bg-safe-500',
    warn: 'bg-warn-500',
    danger: 'bg-crit-500',
    info: 'bg-blue-400',
    muted: 'bg-tx-500',
    cmd: 'bg-command-500',
  }
  const text: Record<StatusTone, string> = {
    ok: 'text-safe-500',
    warn: 'text-warn-500',
    danger: 'text-crit-500',
    info: 'text-blue-400',
    muted: 'text-tx-500',
    cmd: 'text-command-300',
  }
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]', text[tone], className)}>
      <span className="relative flex h-2 w-2">
        {pulse ? (
          <span aria-hidden className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', dot[tone])} />
        ) : null}
        <span aria-hidden className={cn('relative inline-flex h-2 w-2 rounded-full', dot[tone])} />
      </span>
      {label}
    </span>
  )
}

export function CardEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-tx-500', className)}>
      <span aria-hidden className="h-[3px] w-[3px] rounded-full bg-command-500/70" />
      {children}
    </div>
  )
}