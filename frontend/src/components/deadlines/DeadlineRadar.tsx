import type { Derived } from '@/services/db'
import { DeadlineCard, type RadarEntry } from '@/components/deadlines/DeadlineCard'
import { RISK_LADDER, riskMeta } from '@/utils/risk'
import { EmptyState } from '@/components/ui/States'
import { RadarSkeleton } from '@/components/ui/Skeleton'

function toEntries(derived: Derived): RadarEntry[] {
  return derived.snapshot.deadlines.map((deadline) => ({
    deadline,
    assessment: derived.riskByDeadline.get(deadline.id),
    boss: derived.boss.get(deadline.id) ?? deadline.progress,
    milestone: derived.snapshot.milestones.find((m) => m.deadlineId === deadline.id && !m.done) &&
      derived.snapshot.milestones.find((m) => m.deadlineId === deadline.id && !m.done),
    blockedBy: deadline.lockedBy ? derived.snapshot.deadlines.find((d) => d.id === deadline.lockedBy) : undefined,
  })).sort((a, b) => (b.assessment?.score ?? 0) - (a.assessment?.score ?? 0))
}

/**
 * The Deadline Radar — deadlines laid out on the risk spectrum as a line,
 * not a card dump. Severity reads at a glance, left→right = danger rising.
 */
export function DeadlineRadar({ derived, loading }: { derived: Derived | undefined; loading: boolean }) {
  if (loading) return <RadarSkeleton />
  if (!derived) return null

  const entries = toEntries(derived)
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<span aria-hidden>◎</span>}
        title="NO DEADLINES ON THE RADAR"
        body="Nothing is in danger. Create a deadline to turn it into a mission."
      />
    )
  }

  // Spectrum legend with live counts
  const counts = RISK_LADDER.map((lv) => entries.filter((e) => e.assessment?.level === lv).length)

  return (
    <div>
      {/* spectrum line */}
      <div className="mb-4 grid grid-cols-4 gap-2" role="img" aria-label="Deadline risk spectrum">
        {RISK_LADDER.map((lv, i) => (
          <div key={lv} className="rounded-lg border border-line-soft px-2.5 py-2" style={{ borderColor: counts[i] > 0 ? `${riskMeta(lv).hex}55` : undefined, background: counts[i] > 0 ? `${riskMeta(lv).hex}14` : undefined }}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: riskMeta(lv).hex }}>
                {riskMeta(lv).glyph} {lv}
              </span>
              <span className="tnum text-xs font-bold text-tx-300">{counts[i]}</span>
            </div>
            <div className={`mt-1.5 h-1 rounded-full ${riskMeta(lv).bar} ${counts[i] > 0 ? riskMeta(lv).glow : 'opacity-30'}`} />
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {entries.map((e, i) => (
          <DeadlineCard key={e.deadline.id} entry={e} rank={i} />
        ))}
      </div>
    </div>
  )
}