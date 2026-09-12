/* ─────────────────────────────────────────────────────────
   Deadline Commander · Deadlines
   The full battlefield — every deadline on the risk spectrum.
   ───────────────────────────────────────────────────────── */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { useCommand } from '@/hooks/useCommand'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Panel } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/States'
import { DeadlineRadar } from '@/components/deadlines/DeadlineRadar'
import { rise, stagger } from '@/animations'
import { minutesLabel } from '@/utils'

export function DeadlinesPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCommand()

  if (isLoading) return <DeadlinesSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const { deadlines } = data.snapshot
  const critCount = deadlines.filter((d) => (data.riskByDeadline.get(d.id)?.level ?? 'SAFE') === 'CRITICAL').length
  const totalWork = deadlines.reduce((a, d) => a + d.effortHours, 0)
  const safeCount = deadlines.filter((d) => (data.riskByDeadline.get(d.id)?.level ?? 'SAFE') === 'SAFE').length

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Threat Board"
          title="Deadlines"
          subtitle="Every deadline is a boss with a health bar. The radar sorts them by danger so you always see what's at risk first."
          action={
            <Button variant="secondary" style="outline" onClick={() => navigate('/planner')}>
              <CalendarClock className="h-4 w-4" aria-hidden /> Plan the day
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={rise} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Panel className="p-4">
          <Stat label="Deadlines" value={deadlines.length} tone="cmd" />
        </Panel>
        <Panel className="p-4">
          <Stat label="Critical" value={critCount} tone="crit" hint="Need attention now" />
        </Panel>
        <Panel className="p-4">
          <Stat label="Work load" value={totalWork} unit="h" hint={minutesLabel(Math.round(totalWork * 60))} />
        </Panel>
        <Panel className="p-4">
          <Stat label="Safe" value={safeCount} tone="gold" hint="On track" />
        </Panel>
      </motion.div>

      <motion.div variants={rise}>
        <DeadlineRadar derived={data} loading={false} />
      </motion.div>
    </motion.div>
  )
}

function DeadlinesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-ink-800/80" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-ink-800/80" />
        ))}
      </div>
    </div>
  )
}