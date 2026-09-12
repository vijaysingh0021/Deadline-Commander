/* ─────────────────────────────────────────────────────────
   Deadline Commander · Projects (Boss Board)
   Each project is a boss. Beat it before the clock runs out.
   ───────────────────────────────────────────────────────── */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Swords, CalendarClock, Gauge } from 'lucide-react'
import { useCommand } from '@/hooks/useCommand'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardBody, Panel } from '@/components/ui/Card'
import { Badge, RiskBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { BossHealth } from '@/components/deadlines/BossHealth'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { duePhrase, minutesLabel } from '@/utils'

export function ProjectsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCommand()

  if (isLoading) return <ProjectsSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const { deadlines, milestones } = data.snapshot
  const bosses = [...deadlines].sort((a, b) => (data.riskByDeadline.get(b.id)?.score ?? 0) - (data.riskByDeadline.get(a.id)?.score ?? 0))

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Boss Arena"
          title="Projects"
          subtitle="Every deadline is a boss with HP equal to its remaining milestones. Defeat one milestone at a time."
        />
      </motion.div>

      <motion.div variants={rise} className="grid gap-5 md:grid-cols-2">
        {bosses.map((dl) => {
          const assessment = data.riskByDeadline.get(dl.id)
          const boss = data.boss.get(dl.id) ?? dl.progress
          const ownMilestones = milestones.filter((m) => m.deadlineId === dl.id)
          const defeated = ownMilestones.filter((m) => m.done).length
          return (
            <Card key={dl.id} className="cursor-pointer transition-colors hover:border-command-500/40" >
              <div onClick={() => navigate(`/deadline/${dl.id}`)} role="link" aria-label={`Open ${dl.title}`}>
                <CardBody className="space-y-4 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold tracking-tight text-tx-100">{dl.title}</h3>
                    {assessment && <RiskBadge level={assessment.level} />}
                    <Badge tone="neutral">{duePhrase(dl.dueDate)}</Badge>
                  </div>
                  <BossHealth deadline={dl} milestones={ownMilestones} health={boss} compact />
                  <div className="flex items-center justify-between text-[11px] text-tx-500">
                    <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" aria-hidden /> {defeated}/{ownMilestones.length} milestones down</span>
                    <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3" aria-hidden /> {minutesLabel(Math.round(dl.effortHours * 60))} work</span>
                  </div>
                  <Panel className="px-3 py-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-tx-500">
                      <span>Overall progress</span>
                      <span className="tnum">{dl.progress}%</span>
                    </div>
                    <ProgressBar value={dl.progress} tone="cmd" height="h-1.5" className="mt-1" animated={false} />
                  </Panel>
                </CardBody>
              </div>
            </Card>
          )
        })}
      </motion.div>

      {bosses.length === 0 ? (
        <EmptyState
          icon={<Swords className="h-5 w-5" aria-hidden />}
          title="NO BOSSES IN THE ARENA"
          body="Create a deadline to summon your next boss."
        />
      ) : null}
    </motion.div>
  )
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-ink-800/80" />
        ))}
      </div>
    </div>
  )
}