/* ─────────────────────────────────────────────────────────
   Deadline Commander · Character
   Attributes you train by doing + a skill tree you unlock.
   Sophisticated, not childish.
   ───────────────────────────────────────────────────────── */

import { motion } from 'framer-motion'
import { Trophy, Shield, Sparkles, Lock, ChevronRight } from 'lucide-react'
import { useCommand } from '@/hooks/useCommand'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader, CardBody, Panel } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Ring } from '@/components/ui/charts'
import { ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { cn } from '@/utils'
import { combatPower, commanderRank } from '@/utils/gamification'
import type { AttributeMap, Skill } from '@/types'

const ATTR_META: { key: keyof AttributeMap; label: string; hint: string; tone: 'cmd' | 'xp' | 'gold' | 'safe' | 'high' }[] = [
  { key: 'FOCUS', label: 'Focus', hint: 'Length & depth of uninterrupted work', tone: 'cmd' },
  { key: 'DISCIPLINE', label: 'Discipline', hint: 'Showing up every day, on plan', tone: 'safe' },
  { key: 'EXECUTION', label: 'Execution', hint: 'Shipping the hard, blocking tasks', tone: 'xp' },
  { key: 'KNOWLEDGE', label: 'Knowledge', hint: 'Mastery accumulated while building', tone: 'gold' },
  { key: 'PLANNING', label: 'Planning', hint: 'Reading risk & sequencing work', tone: 'high' },
]

const SKILL_ICONS: Record<string, typeof Shield> = {
  target: Shield, list: Shield, clock: Shield, git: Shield, scale: Shield,
  zap: Sparkles, hourglass: Shield, crystal: Sparkles,
}

export function CharacterPage() {
  const { data, isLoading, isError, refetch } = useCommand()

  if (isLoading) return <CharSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const { profile } = data.snapshot
  const xpPct = profile.xpToNext > 0 ? Math.round((profile.xp / profile.xpToNext) * 100) : 0
  const skillTiers = [1, 2, 3].map((tier) => profile.skills.filter((s) => s.tier === tier))
  const rank = commanderRank(profile.level)
  const power = combatPower(profile.attributes, profile.level, profile.streak)

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Identity"
          title="Character"
          subtitle="You level up by doing the work, not by clicking. Attributes reflect how you actually operate."
          action={<Badge tone="xp">{profile.title}</Badge>}
        />
      </motion.div>

      {/* Level header */}
      <motion.div variants={rise}>
        <Panel className="flex flex-wrap items-center gap-5 p-5">
          <Ring value={xpPct} size={92} stroke={8} tone="#2de2c3">
            <span className="font-display mt-1 text-lg font-bold text-command-300">LV.{profile.level}</span>
          </Ring>
          <div className="min-w-[220px] flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tx-500">{profile.title} · Rank {profile.level} · <span className={rank.tone}>{rank.name}</span></p>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-tx-400">
                <span>To next level</span>
                <span className="tnum">{profile.xp}/{profile.xpToNext} XP</span>
              </div>
              <ProgressBar value={xpPct} tone="xp" height="h-2" className="mt-1" />
            </div>
            <p className="mt-2 text-xs text-tx-500">{profile.streak}-day streak · <span className="font-bold text-gold-400">{power} combat power</span></p>
          </div>
        </Panel>
      </motion.div>

      {/* Attributes */}
      <motion.div variants={rise}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ATTR_META.map((a) => (
            <Panel key={a.key} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-tx-500">{a.label}</p>
                <span className={cn('tnum font-display text-lg font-bold', toneClass(a.tone))}>{profile.attributes[a.key]}</span>
              </div>
              <ProgressBar value={profile.attributes[a.key]} tone={a.tone} height="h-1.5" className="mt-2.5" animated={false} />
              <p className="mt-2.5 text-[11px] leading-relaxed text-tx-500">{a.hint}</p>
            </Panel>
          ))}
        </div>
      </motion.div>

      {/* Skill tree */}
      <motion.div variants={rise}>
        <Card>
          <CardHeader
            eyebrow={<><Sparkles className="h-3 w-3" aria-hidden /> Skill Tree</>}
            title="Disciplines you've mastered"
            aside={<Badge tone="cmd">{profile.skills.filter((s) => s.unlocked).length}/{profile.skills.length} unlocked</Badge>}
          />
          <CardBody className="space-y-5 pt-4">
            {skillTiers.map((skills, ti) => (
              <div key={ti}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-tx-500">
                  <span aria-hidden>{['First Principles', 'Advanced Tactics', 'Mastery'][ti]}</span>
                  <span className="h-px flex-1 bg-line-soft" />
                </div>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {skills.map((s) => <SkillNode key={s.id} skill={s} />)}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function SkillNode({ skill }: { skill: Skill }) {
  const Icon = SKILL_ICONS[skill.icon] ?? Shield
  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border px-3.5 py-3',
      skill.unlocked ? 'border-command-500/25 bg-command-500/[0.04]' : 'border-line-soft bg-ink-900/40 opacity-70',
    )}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', skill.unlocked ? 'border-command-500/40 bg-command-500/10 text-command-300' : 'border-line bg-ink-800 text-tx-500')}>
        {skill.unlocked ? <Icon className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn('text-sm font-bold', skill.unlocked ? 'text-tx-100' : 'text-tx-400')}>{skill.name}</p>
          {skill.unlocked ? <Trophy className="h-3 w-3 text-gold-400" aria-hidden /> : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-tx-500">{skill.description}</p>
        {skill.prerequisite && !skill.unlocked ? (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-tx-500">
            <ChevronRight className="h-3 w-3" aria-hidden /> Requires {skill.prerequisite}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function toneClass(t: 'cmd' | 'xp' | 'gold' | 'safe' | 'high'): string {
  return { cmd: 'text-command-300', xp: 'text-xp-500', gold: 'text-gold-400', safe: 'text-safe-500', high: 'text-high-500' }[t]
}

function CharSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="h-32 animate-pulse rounded-xl bg-ink-800/80" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-ink-800/80" />
        ))}
      </div>
    </div>
  )
}
