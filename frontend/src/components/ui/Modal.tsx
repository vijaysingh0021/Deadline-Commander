import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils'
import { backdrop, modal } from '@/animations'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full',
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  eyebrow?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  className?: string
  /** Renders the panel flush to screen edges (mobile sheets). */
  sheet?: boolean
}

/** Accessible, focus-trapped dialog rendered in a portal. */
export function Modal({ open, onClose, title, eyebrow, children, footer, size = 'md', className, sheet }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      // trap focus inside the dialog
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey && (active === first || panelRef.current === active)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // move focus into the dialog on open
    const raf = requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      cancelAnimationFrame(raf)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            key="backdrop"
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="panel"
            variants={modal}
            initial="hidden"
            animate="show"
            exit="hidden"
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Dialog'}
            tabIndex={-1}
            ref={panelRef}
            className={cn(
              'relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-line bg-ink-850 shadow-float sm:rounded-2xl',
              !sheet && SIZES[size],
              sheet && 'min-h-[40dvh] sm:max-w-xl',
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
              <div className="min-w-0">
                {eyebrow ? <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-command-300/80">{eyebrow}</div> : null}
                {title ? <h2 className="truncate font-display text-lg font-bold tracking-tight text-tx-100">{title}</h2> : null}
              </div>
              <button
                aria-label="Close dialog"
                onClick={onClose}
                className="rounded-md p-1 text-tx-500 transition-colors hover:bg-ink-700 hover:text-tx-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
            {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft px-5 py-3.5">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}