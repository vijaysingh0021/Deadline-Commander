import { Flag, LockKeyhole, Skull, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { cn, duePhrase } from '@/utils'
import type { Deadline, RiskAssessment } from '@/types'

export function CampaignMap({ deadlines, assessments }: { deadlines: Deadline[]; assessments: Map<string, RiskAssessment> }) {
  const navigate = useNavigate()
  const sectors = [...deadlines].sort((a, b) => (assessments.get(b.id)?.score ?? 0) - (assessments.get(a.id)?.score ?? 0)).slice(0, 6)
  return <Card className="game-frame overflow-hidden">
    <CardHeader eyebrow={<><Sparkles className="h-3 w-3" aria-hidden /> Campaign map</>} title="Choose your next sector" aside={<span className="text-[10px] font-bold uppercase tracking-wider text-tx-500">{sectors.length} sectors active</span>} />
    <CardBody className="pt-4">
      <div className="campaign-map grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((deadline, index) => {
          const risk = assessments.get(deadline.id)
          const cleared = deadline.progress >= 100
          const locked = Boolean(deadline.lockedBy)
          return <motion.button key={deadline.id} type="button" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} onClick={() => navigate(`/deadline/${deadline.id}`)} className={cn('sector-node text-left', cleared && 'sector-cleared', (risk?.score ?? 0) >= 75 && 'sector-danger')}>
            <span className="sector-orbit" aria-hidden />
            <span className="relative flex items-start gap-3">
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', cleared ? 'border-safe-500/40 bg-safe-500/10 text-safe-500' : locked ? 'border-warn-500/40 bg-warn-500/10 text-warn-500' : 'border-crit-500/40 bg-crit-500/10 text-crit-500')}>
                {cleared ? <Flag className="h-4 w-4" aria-hidden /> : locked ? <LockKeyhole className="h-4 w-4" aria-hidden /> : <Skull className="h-4 w-4" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold text-tx-100">{deadline.title}</span><span className={cn('text-[9px] font-bold uppercase tracking-wider', cleared ? 'text-safe-500' : 'text-crit-500')}>{cleared ? 'Cleared' : `Lv.${Math.max(1, Math.ceil((risk?.score ?? 0) / 20))}`}</span></span><span className="mt-1 block text-xs text-tx-500">{cleared ? 'Sector secured' : `${duePhrase(deadline.dueDate)} · ${risk?.score ?? 0}% threat`}</span><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-ink-700"><span className={cn('block h-full rounded-full', cleared ? 'bg-safe-500' : 'bg-crit-500')} style={{ width: `${deadline.progress}%` }} /></span></span>
            </span>
          </motion.button>
        })}
      </div>
    </CardBody>
  </Card>
}
