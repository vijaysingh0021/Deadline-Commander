/* ─────────────────────────────────────────────────────────
   Deadline Commander · Planner
   Today's command, laid out on a timeline by energy zone.
   Interruptions trigger an intelligent replan — not an error.
   ───────────────────────────────────────────────────────── */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarClock, Lock, Coffee, Sunrise, Sun, Moon, Hourglass, Brain,
  XCircle, Clock, Zap,
} from 'lucide-react'
import { useCommand, useProposeReplan } from '@/hooks/useCommand'
import { fetchPlan } from '@/services/api'
import { keys } from '@/services/keys'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader, CardBody, Panel } from '@/components/ui/Card'
import { RiskBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { ReplanModal } from '@/components/common/ReplanModal'
import { TimelineSkeleton } from '@/components/ui/Skeleton'
import { rise, stagger } from '@/animations'
import { cn, minutesLabel } from '@/utils'
import type { PlanBlock, Zone, ReplanProposal } from '@/types'

const ZONES: { zone: Zone; label: string; icon: typeof Sunrise; glow: string }[] = [
  { zone: 'MORNING', label: 'Morning Command', icon: Sunrise, glow: 'from-command-500/[0.06]' },
  { zone: 'AFTERNOON', label: 'Afternoon Assault', icon: Sun, glow: 'from-warn-500/[0.06]' },
  { zone: 'EVENING', label: 'Evening Review', icon: Moon, glow: 'from-blue-400/[0.06]' },
]

const KIND_META: Record<PlanBlock['kind'], { icon: typeof Clock; tone: string; label: string }> = {
  mission: { icon: Zap, tone: 'text-command-300', label: 'Mission' },
  task: { icon: Clock, tone: 'text-tx-300', label: 'Task' },
  break: { icon: Coffee, tone: 'text-blue-400', label: 'Recovery' },
  personal: { icon: Hourglass, tone: 'text-tx-500', label: 'Admin' },
}

export function PlannerPage() {
  const { data, isLoading, isError, refetch } = useCommand()
  const { data: blocks, isLoading: planLoading } = useQuery({ queryKey: keys.plan, queryFn: fetchPlan })
  const propose = useProposeReplan()
  const [proposal, setProposal] = useState<ReplanProposal | null>(null)
  const [open, setOpen] = useState(false)

  if (isLoading || planLoading) return <TimelineSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const plan = blocks ?? data.snapshot.plan
  const pendingReplan = proposal ?? data.replan

  const markMissed = (title: string) => {
    propose.mutate(title, {
      onSuccess: (p) => {
        setProposal(p)
        setOpen(true)
      },
    })
  }

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Tactical Schedule"
          title="Planner"
          subtitle="Your day assembled by the command brain — deep work in your best windows. When a block slips, the advisor re-plans instead of punishing you."
        />
      </motion.div>

      {/* Zone legend summary */}
      <motion.div variants={rise} className="grid grid-cols-3 gap-3">
        {ZONES.map(({ zone, label }) => {
          const count = plan.filter((b) => b.zone === zone).length
          const total = plan.filter((b) => b.zone === zone).reduce((a, b) => a + b.minutes, 0)
          return (
            <Panel key={zone} className="flex items-center gap-2.5 px-3.5 py-3">
              <span className="text-tx-500" aria-hidden>{labelIcon(zone)}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">{label}</p>
                <p className="tnum text-sm font-bold text-tx-200">{count} blocks · {minutesLabel(total)}</p>
              </div>
            </Panel>
          )
        })}
      </motion.div>

      {/* Timeline by zone */}
      <motion.div variants={rise} className="space-y-6">
        {ZONES.map(({ zone, label, icon: Icon, glow }) => {
          const zoneBlocks = plan.filter((b) => b.zone === zone)
          if (zoneBlocks.length === 0) return null
          return (
            <Card key={zone} className="relative overflow-hidden">
              <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent', glow)} />
              <CardHeader
                eyebrow={<><Icon className="h-3 w-3" aria-hidden /> {label}</>}
                title={zone === 'MORNING' ? 'MORNING COMMAND' : zone === 'AFTERNOON' ? 'AFTERNOON ASSAULT' : 'EVENING REVIEW'}
              />
              <CardBody className="space-y-2 pt-3">
                {zoneBlocks.map((b, i) => <BlockRow key={b.id} block={b} index={i} onMissed={() => markMissed(b.title)} />)}
              </CardBody>
            </Card>
          )
        })}
        {plan.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="h-5 w-5" aria-hidden />}
            title="NO PLAN GENERATED"
            body="Open a mission or add a deadline, and the brain will assemble your day."
          />
        ) : null}
      </motion.div>

      {/* Replan gesture — surface the advisor's latest proposal */}
      {pendingReplan ? (
        <motion.div variants={rise}>
          <Card className="overflow-hidden border-warn-500/30">
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-warn-500">
                <Brain className="h-3.5 w-3.5" aria-hidden /> Adviser
              </div>
              <p className="text-sm leading-relaxed text-tx-300">{pendingReplan.reason}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
                  View proposed plan
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setProposal(null)}>
                  Dismiss
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      ) : null}

      {pendingReplan ? (
        <ReplanModal proposal={pendingReplan} open={open} onClose={() => { setOpen(false); setProposal(null) }} />
      ) : null}
    </motion.div>
  )
}

function BlockRow({ block, index, onMissed }: { block: PlanBlock; index: number; onMissed: () => void }) {
  const kind = KIND_META[block.kind]
  const KIcon = kind.icon
  const flexible = !block.locked
  return (
    <motion.div
      variants={rise}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.04 }}
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border px-3.5 py-2.5',
        flexible ? 'border-line-soft bg-ink-900/50' : 'border-line/60 bg-ink-900/30',
      )}
    >
      <span className={cn('tnum w-11 shrink-0 text-sm font-bold', block.risk === 'HIGH' || block.risk === 'CRITICAL' ? 'text-crit-500' : 'text-command-300')}>{block.start}</span>
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-ink-800', kind.tone)}>
        <KIcon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-tx-200">{block.title}</p>
          {block.risk && block.risk !== 'SAFE' ? <RiskBadge level={block.risk} /> : null}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-tx-500">
          <span>{kind.label}</span>·<span>{minutesLabel(block.minutes)}</span>
          {flexible ? <span className="inline-flex items-center gap-0.5 text-command-300/80"><Zap className="h-2.5 w-2.5" aria-hidden />flexible</span> : null}
          {block.locked ? <span className="inline-flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" aria-hidden />anchored</span> : null}
        </div>
      </div>
      {block.progress !== undefined ? (
        <div className="hidden w-20 sm:block">
          <ProgressBar value={block.progress * 100} tone="cmd" height="h-1" animated={false} />
        </div>
      ) : null}
      {flexible ? (
        <Button variant="ghost" size="sm" className="text-warn-500 hover:text-warn-400" onClick={onMissed}>
          <XCircle className="h-3.5 w-3.5" aria-hidden /> Missed
        </Button>
      ) : null}
    </motion.div>
  )
}

function labelIcon(zone: Zone) {
  if (zone === 'MORNING') return '☀'
  if (zone === 'AFTERNOON') return '⛅'
  return '◐'
}