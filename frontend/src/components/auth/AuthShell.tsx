/* ─────────────────────────────────────────────────────────
   Deadline Commander · Auth shell
   Standalone full-screen layout for /login and /signup —
   brand lockup, ambient signal glow, centered gate card.
   ───────────────────────────────────────────────────────── */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardBody } from '@/components/ui/Card'

function BrandLockup() {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-command-500 to-command-700 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path d="M6 8 L12 2 L18 8 L15.5 8 L15.5 19 L8.5 19 L8.5 8 Z" fill="#0b0e13" />
          <rect x="11" y="9.5" width="2" height="7" rx="1" fill="#0b0e13" />
        </svg>
      </span>
      <div className="text-center leading-none">
        <div className="font-display text-lg font-bold tracking-[0.08em] text-tx-100">DEADLINE</div>
        <div className="mt-1 font-display text-xs font-semibold tracking-[0.46em] text-command-300/90">COMMANDER</div>
      </div>
    </div>
  )
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  footer,
  children,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="app-grid relative flex min-h-dvh flex-col bg-ink-950">
      {/* ambient signal glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[46rem] max-w-full -translate-x-1/2 -translate-y-1/3 rounded-full bg-command-500/10 blur-3xl"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-command-500/60 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 pb-10 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="mb-8 flex justify-center">
            <BrandLockup />
          </div>

          <Card className="border-line shadow-float">
            <CardBody className="pt-6">
              <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-command-300/90">{eyebrow}</p>
              <h1 className="text-center font-display text-2xl font-bold tracking-tight text-tx-100">{title}</h1>
              {subtitle ? <p className="mx-auto mt-2 max-w-[32ch] text-center text-sm leading-relaxed text-tx-500">{subtitle}</p> : null}
              <div className="mt-6">{children}</div>
            </CardBody>
          </Card>

          {footer ? <div className="mt-6 text-center text-sm text-tx-500">{footer}</div> : null}
        </motion.div>
      </div>
    </div>
  )
}