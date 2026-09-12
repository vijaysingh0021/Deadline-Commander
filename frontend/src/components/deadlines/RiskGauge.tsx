import type { RiskAssessment } from '@/types'
import { riskMeta } from '@/utils/risk'
import { RISK_LADDER } from '@/utils/risk'

/**
 * Compact tactical gauge: the four risk bands as a segmented spectrum,
 * with a needle at the current score. Label + glyph always present.
 */
export function RiskGauge({ assessment, className }: { assessment: RiskAssessment; className?: string; size?: 'sm' | 'md' }) {
  const meta = riskMeta(assessment.level)
  // needle position across the four equal bands
  const needlePct = Math.max(2, Math.min(98, assessment.score))

  return (
    <div className={className}>
      <div className="flex justify-between">
        {RISK_LADDER.map((lv) => (
          <span key={lv} className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: lv === assessment.level ? riskMeta(lv).hex : 'rgba(107,116,133,0.6)' }}>
            {lv}
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1" role="img" aria-label={`Risk ${assessment.score}: ${assessment.level}`}>
        {RISK_LADDER.map((lv) => (
          <span key={lv} className={`h-1.5 flex-1 rounded-full ${riskMeta(lv).bar} ${lv === assessment.level ? riskMeta(lv).glow : 'opacity-25'}`} />
        ))}
      </div>
      <div className="relative mt-1.5 h-1">
        <div aria-hidden className="absolute left-[4%] right-[4%] top-0 h-px bg-line" />
        <span className="absolute top-0 -translate-x-1/2 text-[9px] transition-[left] duration-500" style={{ left: `${needlePct}%`, color: meta.solid }}>
          ▼
        </span>
      </div>
    </div>
  )
}