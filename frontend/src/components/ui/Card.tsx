import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils'

/** Layered surface panel. Default = quiet ink-800 with hairline border. */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'hud-panel relative rounded-xl border border-line-soft bg-gradient-to-b from-ink-800/90 to-ink-850',
        'shadow-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})

export function CardHeader({
  title,
  aside,
  eyebrow,
  className,
}: {
  title: ReactNode
  aside?: ReactNode
  eyebrow?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-4', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">
            {eyebrow}
          </div>
        ) : null}
        <h3 className="truncate font-display text-[15px] font-semibold tracking-tight text-tx-100">{title}</h3>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  )
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 pb-4', className)} {...rest}>
      {children}
    </div>
  )
}

/** A quiet inset well for a high-contrast readout inside a card. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('hud-readout rounded-lg border border-line-soft bg-ink-900/60', className)}>{children}</div>
  )
}
