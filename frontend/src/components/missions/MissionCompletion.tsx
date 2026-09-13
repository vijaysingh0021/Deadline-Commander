import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Coins } from 'lucide-react'
import type { CompleteMissionResult } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { flyUp, backdrop } from '@/animations'

/** Count-up for XP so the gain feels earned, not printed. */
function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

const stages = ['mission', 'xp', 'attributes', 'streak', 'next'] as const
export type CompletionStage = (typeof stages)[number]

export function MissionCompletion({
  result,
  onContinue,
}: {
  result: CompleteMissionResult
  onContinue: () => void
}) {
  const [stageIdx, setStageIdx] = useState(0)
  const xp = useCountUp(result.xpGained)
  const attrEntries = Object.entries(result.attributeDelta).filter(([, v]) => v && v > 0)

  // auto-advance through the sequence if the user waits
  useEffect(() => {
    const timings = [600, 1100, 1400, 1400, 999999]
    const id = setTimeout(() => {
      if (stageIdx < stages.length - 1) setStageIdx((s) => s + 1)
    }, timings[stageIdx])
    return () => clearTimeout(id)
  }, [stageIdx])

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <motion.div variants={backdrop} initial="hidden" animate="show" className="absolute inset-0 bg-ink-950/92 backdrop-blur-md" />
      <motion.div
        variants={flyUp}
        initial="hidden"
        animate="show"
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-ink-850 shadow-float"
      >
        {/* top signal line */}
        <div className="signal-line h-[3px] w-full" />

        <div className="px-6 py-7 text-center sm:px-9">
          {/* Stage 3 name + mission */}
          <motion.div animate={{ opacity: stageIdx >= 0 ? 1 : 0.3, scale: stageIdx >= 0 ? 1 : 0.98 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-command-300/80">Mission Complete</p>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-tx-100 sm:text-3xl">{result.missionTitle}</h2>
          </motion.div>

          {/* XP */}
          <div className="mt-7">
            <motion.div
              animate={{ opacity: stageIdx >= 1 ? 1 : 0.35 }}
              className="flex items-end justify-center gap-2"
              aria-label={`${result.xpGained} XP gained`}
            >
              <span className="tnum font-mono text-5xl font-bold text-xp-500 sm:text-6xl">+{xp}</span>
              <span className="pb-1.5 text-sm font-bold text-xp-500/80">XP</span>
            </motion.div>
            <div className="mx-auto mt-2 h-px w-32 bg-gradient-to-r from-transparent via-xp-500/60 to-transparent" />
            <motion.p animate={{ opacity: stageIdx >= 1 ? 1 : 0.2 }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-gold-400">
              <Coins className="h-3.5 w-3.5" aria-hidden /> +{result.coinsGained} COINS
            </motion.p>
          </div>

          {/* Attributes */}
          <motion.div
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
            animate={{ opacity: stageIdx >= 2 ? 1 : 0.2 }}
          >
            {attrEntries.map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-command-500/30 bg-command-500/10 px-3 py-1 text-xs font-bold text-command-300">
                <span aria-hidden>▲</span>+{v} {k}
              </span>
            ))}
          </motion.div>

          {/* Streak */}
          <motion.div className="mt-5" animate={{ opacity: stageIdx >= 3 ? 1 : 0.2 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-tx-500">Streak</p>
            <p className="mt-1 font-display text-lg font-bold text-tx-100">
              {result.newStreak - 1} <span className="text-tx-600">→</span> <span className="text-high-500">{result.newStreak}</span>{' '}
              <span className="text-sm text-tx-500">days</span>
            </p>
          </motion.div>

          {/* Next action */}
          {stageIdx >= 4 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-7 rounded-xl border border-line-soft bg-ink-900/70 p-4 text-left">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-command-300/80">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden /> Next recommended action
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-tx-300">{result.nextAction}</p>
            </motion.div>
          ) : null}
        </div>

        <div className="flex items-center justify-center border-t border-line-soft px-6 py-4">
          <Button variant="primary" size="lg" onClick={onContinue} className="w-full sm:w-auto sm:px-10">
            <Check className="h-4 w-4" aria-hidden /> Continue
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
