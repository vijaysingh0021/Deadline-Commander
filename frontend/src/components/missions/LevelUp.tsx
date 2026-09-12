import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Shield, Sparkles } from 'lucide-react'
import type { CompleteMissionResult } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { backdrop, flyUp } from '@/animations'

/**
 * Premium, non-childish level-up. A calm, decisive moment — not confetti.
 */
export function LevelUpOverlay({ result, onContinue }: { result: CompleteMissionResult; onContinue: () => void }) {
  const from = result.newLevel - result.levelsGained
  const [reveal, setReveal] = useState(0)
  useEffect(() => {
    const timers = [120, 500, 900].map((d, i) => setTimeout(() => setReveal(i + 1), d))
    const last = setTimeout(() => setReveal(4), 1500)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(last)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[68] flex items-center justify-center p-4">
      <motion.div variants={backdrop} initial="hidden" animate="show" className="absolute inset-0 bg-ink-950/95 backdrop-blur-lg" />
      <motion.div
        variants={flyUp}
        initial="hidden"
        animate="show"
        role="dialog"
        aria-modal="true"
        aria-label="Level up"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gold-400/25 bg-gradient-to-b from-ink-850 to-ink-900 text-center shadow-float"
      >
        <div className="absolute inset-0" aria-hidden>
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(242,193,78,0.14),transparent_70%)]" />
        </div>

        <div className="relative px-7 py-10 sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/40 bg-gold-500/10 shadow-[0_0_40px_-8px_rgba(242,193,78,0.5)]">
            <Trophy className="h-8 w-8 text-gold-400" aria-hidden />
          </div>

          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-tx-100">LEVEL UP</h2>

          <div className="mt-3 flex items-end justify-center gap-3">
            <span className="tnum font-mono text-3xl font-bold text-tx-500 line-through decoration-tx-600/40">{from}</span>
            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 16 }} className="tnum font-display text-5xl font-bold text-gold-400">
              {result.newLevel}
            </motion.span>
          </div>

          <motion.p animate={{ opacity: reveal >= 1 ? 1 : 0 }} className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-command-300">
            New Rank · Deadline Hunter
          </motion.p>

          <div className="mt-6 space-y-2">
            <motion.div
              animate={{ opacity: reveal >= 2 ? 1 : 0, y: reveal >= 2 ? 0 : 6 }}
              className="flex items-center justify-between rounded-xl border border-line-soft bg-ink-900/70 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm text-tx-300">
                <Shield className="h-4 w-4 text-command-400" aria-hidden /> Rewards unlocked
              </span>
              <span className="text-xs font-bold text-tx-100">
                +{result.xpGained} XP
              </span>
            </motion.div>
            <motion.div
              animate={{ opacity: reveal >= 3 ? 1 : 0, y: reveal >= 3 ? 0 : 6 }}
              className="flex items-center justify-between rounded-xl border border-line-soft bg-ink-900/70 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm text-tx-300">
                <Sparkles className="h-4 w-4 text-gold-400" aria-hidden /> New capacity
              </span>
              <span className="text-xs font-bold text-command-300">+3 FOCUS · +2 EXECUTION</span>
            </motion.div>
          </div>
        </div>

        <div className="relative flex justify-center border-t border-line-soft px-6 py-4">
          <Button variant="xp" size="lg" onClick={onContinue} className="px-10">
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  )
}