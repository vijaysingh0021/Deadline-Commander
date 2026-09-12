import { type ReactNode, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/** Lightweight accessible tooltip (shows on hover AND focus). */
export function Tooltip({ label, children, side = 'bottom' }: { label: ReactNode; children: ReactNode; side?: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLSpanElement>(null)
  return (
    <span
      ref={trigger}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby="tt" className="contents">
        {children}
      </span>
      <AnimatePresence>
        {open ? (
          <motion.span
            id="tt"
            role="tooltip"
            initial={{ opacity: 0, y: side === 'bottom' ? -3 : 3, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="pointer-events-none absolute z-40 mt-1.5 max-w-[220px] rounded-md border border-line bg-ink-700 px-2.5 py-1.5 text-xs leading-snug text-tx-100 shadow-float"
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}