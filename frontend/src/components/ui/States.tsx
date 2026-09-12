import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils'

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  body?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-ink-800 text-command-300/80">
        {icon ?? <Rocket className="h-5 w-5" aria-hidden />}
      </div>
      <h3 className="mt-4 font-display text-base font-bold tracking-tight text-tx-100">{title}</h3>
      {body ? <p className="mt-1.5 max-w-[40ch] text-sm leading-relaxed text-tx-500">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  )
}

export function ErrorState({
  title = 'COMMAND CENTER OFFLINE',
  body = 'We couldn\'t retrieve your missions. Check your connection and try again.',
  onRetry,
  className,
}: {
  title?: string
  body?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-crit-500/25 bg-crit-500/[0.04] px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-crit-500/30 bg-crit-500/10 text-crit-500">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 font-display text-base font-bold tracking-tight text-tx-100">{title}</h3>
      <p className="mt-1.5 max-w-[42ch] text-sm leading-relaxed text-tx-500">{body}</p>
      {onRetry ? (
        <Button variant="secondary" style="outline" onClick={onRetry} className="mt-5">
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </Button>
      ) : null}
    </motion.div>
  )
}