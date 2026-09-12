import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Check, ShieldAlert, SlidersHorizontal, Trophy, Sparkles, Info, X } from 'lucide-react'
import { useToast } from '@/stores/toast'
import type { Toast as ToastType } from '@/types'
import { cn } from '@/utils'

const ICONS: Record<ToastType['kind'], { icon: React.ReactNode; ring: string }> = {
  mission: { icon: <Check className="h-4 w-4" />, ring: 'border-command-500/40 text-command-300' },
  plan: { icon: <SlidersHorizontal className="h-4 w-4" />, ring: 'border-blue-400/40 text-blue-400' },
  risk: { icon: <ShieldAlert className="h-4 w-4" />, ring: 'border-crit-500/40 text-crit-500' },
  level: { icon: <Trophy className="h-4 w-4" />, ring: 'border-gold-400/40 text-gold-400' },
  reward: { icon: <Sparkles className="h-4 w-4" />, ring: 'border-gold-400/40 text-gold-400' },
  info: { icon: <Info className="h-4 w-4" />, ring: 'border-line text-tx-300' },
  error: { icon: <X className="h-4 w-4" />, ring: 'border-crit-500/40 text-crit-500' },
}

function ToastRow({ t, onDismiss }: { t: ToastType; onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 4600)
    return () => clearTimeout(id)
  }, [onDismiss])

  const toneClass = ICONS[t.kind].ring
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto w-full"
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'relative flex items-start gap-3 overflow-hidden rounded-xl border bg-ink-800/95 px-4 py-3 shadow-float backdrop-blur-md',
          toneClass,
        )}
      >
        <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-ink-900/60', toneClass)}>
          {ICONS[t.kind].icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold tracking-tight text-tx-100">{t.title}</p>
          {t.detail ? <p className="mt-0.5 text-xs leading-snug text-tx-400">{t.detail}</p> : null}
        </div>
        <button aria-label="Dismiss notification" onClick={onDismiss} className="rounded p-0.5 text-tx-600 hover:text-tx-200">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.li>
  )
}

export function ToastViewport() {
  const toasts = useToast((s) => s.toasts)
  const dismiss = useToast((s) => s.dismiss)
  return createPortal(
    <ul
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 md:bottom-5"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastRow key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </ul>,
    document.body,
  )
}