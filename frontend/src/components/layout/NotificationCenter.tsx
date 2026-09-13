import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CheckCircle2, ChevronRight, Radar, TriangleAlert } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchActivity, fetchDerived } from '@/services/api'
import { keys } from '@/services/keys'
import { cn } from '@/utils'

type Alert = { id: string; title: string; detail: string; tone: 'critical' | 'warning' | 'info'; to: string }

/**
 * Compact HUD event feed. Alerts are derived from the same persisted command
 * snapshot as missions, so no separate notification backend or fake state is
 * introduced.
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { data: derived } = useQuery({ queryKey: keys.derived, queryFn: fetchDerived })
  const { data: activity } = useQuery({ queryKey: keys.activity, queryFn: fetchActivity })

  const alerts = useMemo<Alert[]>(() => {
    const risks = (derived?.snapshot.deadlines ?? []).flatMap((deadline) => {
      const risk = derived?.riskByDeadline.get(deadline.id)
      if (!risk || (risk.level !== 'CRITICAL' && risk.level !== 'HIGH')) return []
      return [{
        id: `risk-${deadline.id}`,
        title: risk.level === 'CRITICAL' ? 'CRITICAL DEADLINE ALERT' : 'PRIORITY SIGNAL',
        detail: `${deadline.title} — ${risk.why}`,
        tone: risk.level === 'CRITICAL' ? 'critical' as const : 'warning' as const,
        to: `/deadlines/${deadline.id}`,
      }]
    })
    const events = (activity ?? []).slice(0, 4).map((event) => ({
      id: event.id,
      title: event.title,
      detail: event.detail,
      tone: 'info' as const,
      to: event.kind === 'achievement' ? '/achievements' : event.kind === 'level' ? '/character' : '/missions',
    }))
    return [...risks, ...events].slice(0, 6)
  }, [activity, derived])

  useEffect(() => {
    const dismiss = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', dismiss)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', dismiss)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const critical = alerts.filter((alert) => alert.tone === 'critical').length
  return (
    <div ref={root} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${critical ? `, ${critical} critical` : ''}`}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-line bg-ink-900/70 text-tx-400 transition-colors hover:border-command-500/40 hover:text-command-300"
      >
        <Bell className="h-3.5 w-3.5" aria-hidden />
        {critical ? <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-crit-500 ring-2 ring-ink-950" /> : null}
      </button>

      {open ? (
        <section className="absolute right-0 top-10 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-ink-850 shadow-float" aria-label="Command notifications">
          <header className="flex items-center justify-between border-b border-line-soft px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-command-300">Signal relay</p>
              <h2 className="font-display text-sm font-bold text-tx-100">COMMAND NOTIFICATIONS</h2>
            </div>
            <Radar className="h-4 w-4 text-command-400" aria-hidden />
          </header>
          <div className="max-h-[min(60vh,380px)] overflow-y-auto p-2">
            {alerts.length ? alerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => { setOpen(false); navigate(alert.to) }}
                className="group flex w-full gap-3 rounded-lg p-3 text-left transition-colors hover:bg-ink-800"
              >
                <span className={cn('mt-0.5', alert.tone === 'critical' ? 'text-crit-500' : alert.tone === 'warning' ? 'text-high-500' : 'text-command-400')}>
                  {alert.tone === 'critical' ? <TriangleAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold tracking-wide text-tx-200">{alert.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-tx-500">{alert.detail}</span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-tx-600 transition-transform group-hover:translate-x-0.5 group-hover:text-command-300" aria-hidden />
              </button>
            )) : (
              <div className="px-4 py-10 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-safe-500" aria-hidden />
                <p className="mt-2 text-sm font-semibold text-tx-200">ALL SYSTEMS CLEAR</p>
                <p className="mt-1 text-xs text-tx-500">No critical mission signals detected.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
