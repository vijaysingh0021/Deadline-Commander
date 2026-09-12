import { Crosshair, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BossHealth } from '@/components/deadlines/BossHealth'
import type { Derived } from '@/services/db'
import { riskMeta } from '@/utils/risk'

export function BossArena({ derived }: { derived: Derived }) {
  const navigate = useNavigate()
  const target = [...derived.snapshot.deadlines].filter((deadline) => deadline.progress < 100).sort((a, b) => (derived.riskByDeadline.get(b.id)?.score ?? 0) - (derived.riskByDeadline.get(a.id)?.score ?? 0))[0]
  if (!target) return null
  const assessment = derived.riskByDeadline.get(target.id)
  const health = derived.boss.get(target.id) ?? 100
  const meta = riskMeta(assessment?.level ?? 'SAFE')
  return <Card className="relative overflow-hidden">
    <div aria-hidden className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-crit-500/[0.08] to-transparent" />
    <CardHeader eyebrow={<><Crosshair className="h-3 w-3" aria-hidden /> Tactical encounter</>} title="Active boss threat" aside={<span className={`rounded-full border border-current/20 bg-ink-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.text}`}>{assessment?.level ?? 'SAFE'} · {assessment?.score ?? 0}% risk</span>} />
    <CardBody className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <BossHealth deadline={target} milestones={derived.snapshot.milestones} health={health} />
      <div className="flex flex-col items-start gap-2.5 lg:w-48"><div className="flex items-center gap-2 text-xs text-tx-500"><ShieldAlert className="h-4 w-4 text-crit-500" aria-hidden /> Threat briefing</div><p className="text-sm leading-relaxed text-tx-300">{assessment?.why ?? 'Assess this deadline before committing your next block.'}</p><Button variant="primary" size="sm" onClick={() => navigate(`/deadline/${target.id}`)}>Enter battle plan</Button></div>
    </CardBody>
  </Card>
}
