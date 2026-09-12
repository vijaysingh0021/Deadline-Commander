/* ─────────────────────────────────────────────────────────
   Deadline Commander · 404
   In-shell fallback for unknown routes. No redirect, no
   silent bounce — a proper signpost back to home.
   ───────────────────────────────────────────────────────── */

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden rounded-xl border border-line-soft text-center"
    >
      {/* hazard accent band */}
      <div aria-hidden className="hazard absolute inset-x-0 top-0 h-1.5 text-crit-500/50" />
      <div aria-hidden className="hazard absolute inset-x-0 bottom-0 h-1.5 text-crit-500/50" />

      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crit-500/10 blur-3xl" />

      <motion.div
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        className="relative flex flex-col items-center"
      >
        <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.34em] text-crit-500">
          <Compass className="h-3.5 w-3.5" aria-hidden /> Signal lost
        </p>
        <h1 className="tnum mt-4 font-display text-[6rem] font-bold leading-none tracking-tight text-tx-100 sm:text-[8.5rem]">
          4<span className="text-command-500">0</span>4
        </h1>
        <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-tx-400">
          That sector does not exist on the grid. The coordinates you entered aren't in the command database — and
          no silent redirect was issued.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
          <Link to="/" tabIndex={-1}>
            <Button variant="primary" size="lg">
              <Home className="h-4 w-4" aria-hidden /> Return to dashboard
            </Button>
          </Link>
          <Link to="/missions" tabIndex={-1}>
            <Button variant="secondary" size="lg" style="outline">
              Browse missions
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}