import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Plus, Brain, CheckCircle, Clock } from 'lucide-react'
import type { ReplanProposal, PlanChange } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAcceptReplan } from '@/hooks/useCommand'
import { cn } from '@/utils'

const KIND_META: Record<PlanChange['kind'], { icon: typeof ArrowUp; label: string; tone: string }> = {
  shift: { icon: Clock, label: 'Shift', tone: 'text-blue-400' },
  raise: { icon: ArrowUp, label: 'Raised', tone: 'text-crit-500' },
  lower: { icon: ArrowDown, label: 'Lowered', tone: 'text-tx-500' },
  add: { icon: Plus, label: 'Added', tone: 'text-xp-500' },
  drop: { icon: ArrowDown, label: 'Dropped', tone: 'text-tx-500' },
}

/**
 * The assistant, not an error. When a plan is interrupted the system
 * explains what changed and why, then asks to accept the new plan.
 */
export function ReplanModal({ proposal, open, onClose }: { proposal: ReplanProposal; open: boolean; onClose: () => void }) {
  const accept = useAcceptReplan()

  const handleAccept = () => {
    accept.mutate(undefined, { onSuccess: onClose })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Smart Assistant"
      title="PLAN INTERRUPTED"
      footer={
        <>
          <Button variant="secondary" style="outline" onClick={onClose}>
            Not now
          </Button>
          <Button variant="primary" onClick={handleAccept} disabled={accept.isPending}>
            <CheckCircle className="h-4 w-4" aria-hidden />
            {accept.isPending ? 'Applying…' : 'Accept new plan'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-warn-500/25 bg-warn-500/[0.06] px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warn-500/15 text-warn-500">
            <Brain className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-tx-100">You missed: “{proposal.missed}”</p>
            <p className="mt-1 text-xs leading-relaxed text-tx-400">{proposal.reason}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-tx-500">System recommendation</p>
          <div className="space-y-1.5">
            {proposal.changes.map((c, i) => {
              const meta = KIND_META[c.kind]
              const Icon = meta.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className={cn('flex items-center gap-3 rounded-lg border border-line-soft bg-ink-900/60 px-3 py-2.5')}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-800 ${meta.tone}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-tx-300">
                    <span className="font-semibold text-tx-100">{meta.label}</span>
                    {' · '}
                    {c.target}
                  </span>
                  <span className="text-xs text-tx-500">{c.detail}</span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {proposal.finalDeadlineChanged ? (
          <p className="text-xs text-crit-500">Note: your final deadline shifted. Review before accepting.</p>
        ) : (
          <p className="text-xs text-tx-500">Final deadline unchanged — your targets remain safe.</p>
        )}
      </div>
    </Modal>
  )
}