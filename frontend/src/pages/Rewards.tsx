/* ─────────────────────────────────────────────────────────
   Deadline Commander · Rewards
   The armory. Spend gold on equipment that makes you a
   better commander, not a shinier one.
   ───────────────────────────────────────────────────────── */

import { motion } from 'framer-motion'
import { Coins, Check, Sparkles, Cpu } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCommand } from '@/hooks/useCommand'
import { buyReward } from '@/services/api'
import { keys } from '@/services/keys'
import { useToast } from '@/stores/toast'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardBody, Panel } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { cn } from '@/utils'
import type { RewardItem } from '@/types'

function Strength({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Tier ${n}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn('h-1.5 w-3 rounded-full', i <= n ? 'bg-gold-400' : 'bg-ink-600')} />
      ))}
    </span>
  )
}

export function RewardsPage() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  const { data, isLoading, isError, refetch } = useCommand()

  if (isLoading) return <RewardsSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const rewards = data.snapshot.rewards
  const gold = data.snapshot.profile.gold

  const tryBuy = (r: RewardItem) => {
    buyReward(r.id).then((res) => {
      qc.invalidateQueries({ queryKey: keys.derived })
      qc.invalidateQueries({ queryKey: keys.activity })
      toast({
        kind: res.ok ? 'reward' : 'info',
        title: res.ok ? 'EQUIPPED' : 'CANNOT AFFORD',
        detail: res.ok ? `${res.name} acquired` : `${r.name} · ${r.priceGold} gold`,
      })
    })
  }

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="Armory"
          title="Rewards"
          subtitle="Every mission pays gold. Spend it on equipment that raises your pace, focus and resilience."
          action={
            <Panel className="flex items-center gap-2 px-4 py-2.5">
              <Coins className="h-4 w-4 text-gold-400" aria-hidden />
              <span className="tnum font-display text-lg font-bold text-tx-100">{gold}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">gold</span>
            </Panel>
          }
        />
      </motion.div>

      <motion.div variants={rise} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((r) => {
          const owns = r.owned
          const canAfford = gold >= r.priceGold
          return (
            <Card key={r.id} className={cn(owns && 'overflow-hidden border-gold-400/25')}>
              {owns ? <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold-500/80 to-gold-400/40" /> : null}
              <CardBody className="space-y-3 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <span className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                    owns ? 'border-gold-400/40 bg-gold-500/10 text-gold-400' : 'border-line bg-ink-800 text-tx-500',
                  )}>
                    {owns ? <Cpu className="h-4 w-4" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
                  </span>
                  <div className="min-w-0 text-right">
                    <p className="font-display text-sm font-bold tracking-tight text-tx-100">{r.name}</p>
                    <div className="mt-0.5 flex items-center justify-end gap-2">
                      <Strength n={r.strength} />
                      {r.equipped ? <Badge tone="cmd">equipped</Badge> : null}
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-tx-500">{r.description}</p>

                <div className="rounded-lg border border-line-soft bg-ink-900/50 px-3 py-2 text-xs text-tx-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-tx-500">Effect · </span>
                  {r.effect}
                </div>

                <Button
                  variant={owns ? 'secondary' : 'primary'}
                  style={owns ? 'subtle' : 'solid'}
                  size="md"
                  className="w-full"
                  disabled={owns}
                  onClick={() => tryBuy(r)}
                >
                  {owns ? (
                    <><Check className="h-4 w-4" aria-hidden /> Owned</>
                  ) : (
                    <><Coins className="h-4 w-4" aria-hidden /> {r.priceGold} gold</>
                  )}
                </Button>
                {!owns && !canAfford ? (
                  <p className="text-center text-[11px] text-crit-500">You need {r.priceGold - gold} more gold</p>
                ) : null}
              </CardBody>
            </Card>
          )
        })}
      </motion.div>

      {rewards.length === 0 ? (
        <EmptyState
          icon={<Coins className="h-5 w-5" aria-hidden />}
          title="ARMORY EMPTY"
          body="Complete missions to earn gold and unlock your first piece of equipment."
        />
      ) : null}
    </motion.div>
  )
}

function RewardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl bg-ink-800/80" />
        ))}
      </div>
    </div>
  )
}