import { Crown, ShieldCheck, Sparkles, Trophy, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardBody, CardHeader, Panel } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/utils'
import { combatPower, commanderRank } from '@/utils/gamification'
import type { ActivityEvent, Achievement, Deadline, Profile } from '@/types'

type Quest = { label: string; detail: string; value: number; target: number; icon: typeof Zap; tone: string }

function isToday(timestamp: string) {
  return new Date(timestamp).toDateString() === new Date().toDateString()
}

export function CampaignBoard({ profile, deadlines, activity, achievements }: {
  profile: Profile; deadlines: Deadline[]; activity: ActivityEvent[]; achievements: Achievement[]
}) {
  const missionsToday = activity.filter((event) => event.kind === 'mission' && isToday(event.at)).length
  const xpToday = activity.filter((event) => isToday(event.at)).reduce((total, event) => total + Math.max(0, event.deltaXp ?? 0), 0)
  const bossesDefeated = deadlines.filter((deadline) => deadline.progress >= 100).length
  const nextAchievement = achievements.find((achievement) => !achievement.unlocked)
  const rank = commanderRank(profile.level)
  const power = combatPower(profile.attributes, profile.level, profile.streak)
  const quests: Quest[] = [
    { label: 'First strike', detail: 'Complete a mission today', value: missionsToday, target: 1, icon: Zap, tone: 'text-command-300' },
    { label: 'Momentum', detail: 'Earn 100 XP today', value: xpToday, target: 100, icon: Sparkles, tone: 'text-gold-400' },
    { label: 'Boss hunter', detail: 'Defeat a deadline boss', value: bossesDefeated, target: Math.max(1, bossesDefeated + 1), icon: ShieldCheck, tone: 'text-safe-500' },
  ]

  return <Card className="relative overflow-hidden">
    <div aria-hidden className="absolute -right-14 -top-20 h-48 w-48 rounded-full bg-command-500/10 blur-3xl" />
    <CardHeader eyebrow={<><Trophy className="h-3 w-3" aria-hidden /> Campaign board</>} title="Today’s progression"
      aside={<span className={cn('rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider', rank.tone)}>{rank.name} · {power} CP</span>} />
    <CardBody className="relative space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {quests.map((quest, index) => {
          const complete = quest.value >= quest.target
          const value = Math.min(100, Math.round((quest.value / quest.target) * 100))
          const Icon = quest.icon
          return <motion.div key={quest.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
            <Panel className={cn('h-full border-l-2 px-3.5 py-3', complete ? 'border-safe-500 bg-safe-500/5' : 'border-command-500/50')}>
              <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><Icon className={cn('h-4 w-4', quest.tone)} aria-hidden /><p className="text-xs font-bold text-tx-200">{quest.label}</p></div><span className={cn('text-[9px] font-bold uppercase tracking-wider', complete ? 'text-safe-400' : 'text-tx-500')}>{complete ? 'Cleared' : `${quest.value}/${quest.target}`}</span></div>
              <p className="mt-2 text-xs text-tx-500">{quest.detail}</p><ProgressBar value={value} tone={complete ? 'safe' : 'xp'} height="h-1.5" className="mt-3" />
            </Panel>
          </motion.div>
        })}
      </div>
      {nextAchievement ? <div className="flex items-center gap-3 rounded-lg border border-line bg-ink-900/70 px-3.5 py-3"><Crown className="h-4 w-4 shrink-0 text-gold-400" aria-hidden /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-tx-500">Next unlock</p><p className="truncate text-sm font-semibold text-tx-200">{nextAchievement.name} <span className="font-normal text-tx-500">· {nextAchievement.description}</span></p></div><span className="tnum text-xs font-bold text-command-300">{nextAchievement.progressNow}/{nextAchievement.progressTarget}</span></div> : <div className="flex items-center gap-2 rounded-lg border border-gold-400/25 bg-gold-400/5 px-3.5 py-3 text-sm font-semibold text-gold-300"><Crown className="h-4 w-4" aria-hidden /> Every campaign achievement unlocked.</div>}
    </CardBody>
  </Card>
}
