import { type ReactNode } from 'react'
import { cn } from '@/utils'

export function SectionHeader({
  label,
  title,
  hint,
  action,
  className,
}: {
  label?: string
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {label ? (
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-tx-500">
            <span aria-hidden className="h-1 w-1 rounded-full bg-command-500/80" />
            {label}
          </div>
        ) : null}
        <h2 className="font-display text-xl font-bold tracking-tight text-tx-100 sm:text-2xl">{title}</h2>
        {hint ? <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-tx-500">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** Page-level heading used by every routed page. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow ? (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-command-300/90">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-tx-100 sm:text-[2.1rem]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-tx-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  )
}