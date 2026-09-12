/* ─────────────────────────────────────────────────────────
   Deadline Commander · Analytics
   Your after-action report — no spreadsheets. Read the shape
   of your performance and where the pressure builds.
   ───────────────────────────────────────────────────────── */

import { motion } from 'framer-motion'
import { Clock, TrendingUp, Flame, AlertTriangle, Lightbulb } from 'lucide-react'
import { useCommand } from '@/hooks/useCommand'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader, CardBody, Panel } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { Badge, RiskBadge } from '@/components/ui/Badge'
import { BarRow, CompareBars, RiskTrend } from '@/components/ui/charts'
import { ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { riskMeta } from '@/utils/risk'
import { riskLevelForScore } from '@/services/brain'

export function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useCommand()

  if (isLoading) return <AnalyticsSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const report = data.snapshot.report
  const latestRisk = report.riskTrend[report.riskTrend.length - 1]?.avgRisk ?? 0
  const latestLevel = riskLevelForScore(latestRisk)
  const hot = report.hotSpot

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow={`${report.weekLabel} · After-Action Report`}
          title="Analytics"
          subtitle="Not a dashboard of vanity metrics — a read on where you are winning and where pressure is building."
          action={<Badge tone="cmd">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Badge>}
        />
      </motion.div>

      {/* KPIs */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel className="p-4">
          <Stat label="Hours completed" value={report.hoursCompleted} unit="h" tone="xp" prefix={<Clock className="h-3.5 w-3.5" aria-hidden />} />
        </Panel>
        <Panel className="p-4">
          <Stat label="Execution" value={report.executionEfficiency} unit="%" tone="cmd" hint="Efficiency of executed time" />
        </Panel>
        <Panel className="p-4">
          <Stat label="Deadline success" value={report.deadlineSuccessRate} unit="%" tone="gold" hint="Finished on or before deadline" />
        </Panel>
        <Panel className="p-4">
          <Stat label="Completion rate" value={report.completionRate} unit="%" tone="cmd" hint="Tasks marked done" />
        </Panel>
      </motion.div>

      {/* Best window + hot spot */}
      <motion.div variants={rise} className="grid gap-5 md:grid-cols-2">
        <Card className="overflow-hidden border-command-500/20">
          <CardHeader
            eyebrow={<><Flame className="h-3 w-3" aria-hidden /> Performance Window</>}
            title="Your best hours"
          />
          <CardBody>
            <div className="flex items-end gap-3">
              <span className="tnum font-display text-3xl font-bold text-command-300">{report.bestWindow.from}</span>
              <span className="text-tx-600">→</span>
              <span className="tnum font-display text-3xl font-bold text-command-300">{report.bestWindow.to}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-tx-500">{report.bestWindow.note}</p>
            <div className="mt-4">
              <BarRow items={report.productivity.map((p) => ({ label: p.label, value: p.hours }))} tone="#2de2c3" emphasize={2} />
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden border-warn-500/25">
          <CardHeader
            eyebrow={<><AlertTriangle className="h-3 w-3" aria-hidden /> Risk Trend</>}
            title="Pressure building this week"
            aside={<RiskBadge level={latestLevel} />}
          />
          <CardBody>
            <RiskTrend
              points={report.riskTrend.map((p) => ({ label: p.day, value: p.avgRisk }))}
              latestTone={riskMeta(latestLevel).hex}
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line-soft bg-ink-900/60 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Hot spot</p>
                <p className="mt-0.5 text-sm font-semibold text-tx-200">{hot.title}</p>
                <p className="mt-0.5 text-xs text-warn-500">{hot.where}</p>
              </div>
              <div className="rounded-lg border border-line-soft bg-ink-900/60 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-tx-500">Avg risk now</p>
                <p className="tnum mt-0.5 font-display text-xl font-bold text-high-500">{latestRisk}%</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Planned vs actual */}
      <motion.div variants={rise}>
        <Card>
          <CardHeader
            eyebrow={<><TrendingUp className="h-3 w-3" aria-hidden /> Fidelity</>}
            title="Planned vs actual"
            aside="dimmer = planned · bright = actual"
          />
          <CardBody className="pt-3">
            <CompareBars items={report.plannedVsActual.map((p) => ({ label: p.day, planned: p.planned, actual: p.actual }))} />
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-tx-500">
                <span className="h-2.5 w-4 rounded-sm bg-[#6b7485] opacity-50" aria-hidden /> planned
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-tx-500">
                <span className="h-2.5 w-4 rounded-sm bg-[#2de2c3]" aria-hidden /> actual
              </span>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Advisor note */}
      <motion.div variants={rise}>
        <Card className="overflow-hidden border-command-500/20 bg-gradient-to-br from-command-500/[0.05] to-transparent">
          <CardBody className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-command-500/10 text-command-300">
              <Lightbulb className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-command-300/80">Command Brain</p>
              <p className="mt-1 text-sm leading-relaxed text-tx-300">{report.styleNote}</p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  )
}

  function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-ink-800/80" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-ink-800/80" />
        <div className="h-72 animate-pulse rounded-xl bg-ink-800/80" />
      </div>
    </div>
  )
}