import { useNavigate } from 'react-router-dom'
import { Flame, Trophy, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNow } from '@/hooks/useMediaQuery'
import { fetchProfile } from '@/services/api'
import { keys } from '@/services/keys'
import { cn } from '@/utils'

export function TopBar() {
  const now = useNow(1000)
  const time = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const navigate = useNavigate()
  const { data: profile } = useQuery({ queryKey: keys.profile, queryFn: fetchProfile })

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line-soft bg-ink-950/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-md border border-line bg-ink-900/70 px-2.5 py-1 font-mono text-xs tracking-[0.14em] text-tx-400">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-command-500" aria-hidden />
          <span className="tnum">{time}</span>
        </span>
        <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-tx-600 sm:inline">
          Command Center · Active
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* streak chip */}
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-ink-900/70 px-3 py-1" title={`${profile?.streak ?? 0}-day streak`}>
          <Flame className="h-3.5 w-3.5 text-high-500" aria-hidden />
          <span className="tnum text-xs font-bold text-tx-200">{profile?.streak ?? 0}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-tx-500">days</span>
        </div>
        {/* level chip */}
        <div
          className="flex items-center gap-2 rounded-full border border-command-500/30 bg-command-500/10 px-3 py-1"
          title={`Level ${profile?.level ?? '—'} · ${profile?.xp ?? 0}/${profile?.xpToNext ?? 0} XP`}
        >
          <Trophy className="h-3.5 w-3.5 text-gold-400" aria-hidden />
          <span className={cn('font-display text-xs font-bold tracking-wide text-command-300')}>LV. {profile?.level ?? '—'}</span>
        </div>
        {/* avatar */}
        <button
          onClick={() => navigate('/character')}
          aria-label="Open your character"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-command-500/30 bg-gradient-to-br from-ink-700 to-ink-850 text-tx-200 shadow-glow transition-transform hover:scale-105"
        >
          <UserRound className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </header>
  )
}
