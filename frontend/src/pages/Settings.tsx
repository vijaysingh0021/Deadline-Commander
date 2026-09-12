/* ─────────────────────────────────────────────────────────
   Deadline Commander · Settings
   Preferences live in localStorage (services/settings.ts) and
   survive demo resets. Identity edits go through the command
   snapshot; appearance toggles apply CSS flags document-wide.
   ───────────────────────────────────────────────────────── */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Palette, Gauge, LogOut, RotateCcw, UserRound,
  KeyRound, SlidersHorizontal, Sparkles,
} from 'lucide-react'
import { useCommand, useUpdateProfile } from '@/hooks/useCommand'
import { loadSettings, persistSettings, DEFAULT_SETTINGS, type CommanderSettings } from '@/services/settings'
import { loadSession, signOut } from '@/services/auth'
import { useToast } from '@/stores/toast'
import { PageHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader, CardBody, Panel } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/States'
import { rise, stagger } from '@/animations'
import { cn } from '@/utils'

const field =
  'h-10 w-full rounded-lg border border-line bg-ink-900/70 px-3 text-sm text-tx-100 focus:border-command-500/60 focus:outline-none'

const LABEL = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500'

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-line-soft bg-ink-900/50 px-4 py-3 text-left transition-colors hover:border-line focus-visible:outline-2 focus-visible:outline-command-500"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-tx-200">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-snug text-tx-500">{description}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          checked ? 'border-command-500/60 bg-command-500/25' : 'border-line bg-ink-700',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full transition-transform',
            checked ? 'translate-x-[22px] bg-command-400' : 'translate-x-[3px] bg-tx-500',
          )}
        />
      </span>
    </button>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const toast = useToast((s) => s.push)
  const { data, isLoading, isError, refetch } = useCommand()
  const updateProfile = useUpdateProfile()

  const [settings, setSettings] = useState(loadSettings)
  const [draft, setDraft] = useState<{ name?: string; title?: string } | null>(null)

  if (isLoading) return <SettingsSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const profile = data.snapshot.profile
  const session = loadSession()
  const shownName = (draft?.name ?? profile.name).trim()
  const dirty = draft !== null && (draft.name !== undefined || draft.title !== undefined)

  const patch = (p: Partial<CommanderSettings>) => setSettings(persistSettings(p))

  const saveProfile = () => {
    if (!dirty) return
    const patchData: Partial<Pick<typeof profile, 'name' | 'title'>> = {}
    if (draft?.name !== undefined && draft.name.trim() !== '' && draft.name.trim() !== profile.name) patchData.name = draft.name.trim()
    if (draft?.title !== undefined && draft.title !== profile.title) patchData.title = draft.title
    if (Object.keys(patchData).length === 0) return setDraft(null)
    updateProfile.mutate(patchData)
    setDraft(null)
  }

  const handleLogout = () => {
    signOut()
    toast({ kind: 'info', title: 'SESSION ENDED', detail: 'Signed out of the demo session.' })
    navigate('/login')
  }

  const resetAll = () => {
    setSettings(persistSettings({ ...DEFAULT_SETTINGS }))
    toast({ kind: 'info', title: 'DEFAULTS RESTORED', detail: 'All preferences reset to factory settings.' })
  }

  return (
    <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={rise}>
        <PageHeader
          eyebrow="System Configuration"
          title="Settings"
          subtitle="Preferred methods, session pacing, notification protocols and appearance. Stored locally in this browser — they survive demo resets."
          action={<Button variant="secondary" style="outline" onClick={resetAll}><RotateCcw className="h-4 w-4" aria-hidden /> Restore defaults</Button>}
        />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Commander dossier */}
        <motion.div variants={rise}>
          <Card className="h-full">
            <CardHeader eyebrow={<><UserRound className="h-3 w-3" aria-hidden /> Identity</>} title="Commander dossier" />
            <CardBody className="pt-2">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge tone="cmd" dot>{profile.title}</Badge>
                <Badge tone="neutral">LV.{profile.level}</Badge>
                <Badge tone="gold">{profile.streak} day streak</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block sm:col-span-2">
                  <span className={LABEL}>Callsign</span>
                  <input
                    className={field}
                    value={draft?.name ?? profile.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    aria-label="Callsign"
                  />
                </label>
                <label className="block">
                  <span className={LABEL}>Rank</span>
                  <select
                    className={field}
                    value={draft?.title ?? profile.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    aria-label="Rank"
                  >
                    {['Field Commander', 'Tactical Officer', 'Logistics Specialist', 'Analyst', 'Liberator'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="primary" size="sm" disabled={!dirty || shownName === ''} onClick={saveProfile}>
                  Save identity
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Session */}
        <motion.div variants={rise}>
          <Card className="h-full">
            <CardHeader eyebrow={<><KeyRound className="h-3 w-3" aria-hidden /> Access</>} title="Session" />
            <CardBody className="pt-2">
              <Panel className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-tx-200">
                    {session ? `${session.commander} · ${session.title}` : 'Not signed in'}
                  </p>
                  <p className="mt-0.5 text-xs text-tx-500">
                    {session
                      ? `Active since ${new Date(session.signedInAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                      : 'Sessions are cosmetic — the app is fully usable unsigned.'}
                  </p>
                </div>
                <Badge tone={session ? 'safe' : 'neutral'} dot>{session ? 'Signed in' : 'Guest'}</Badge>
              </Panel>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {session ? (
                  <Button variant="danger" style="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                    Sign in
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Focus & pace */}
        <motion.div variants={rise}>
          <Card>
            <CardHeader eyebrow={<><Gauge className="h-3 w-3" aria-hidden /> Pacing</>} title="Focus sessions & workload" />
            <CardBody className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className={LABEL}>Focus length</span>
                  <select
                    className={field}
                    value={settings.focusMinutes}
                    onChange={(e) => patch({ focusMinutes: Number(e.target.value) })}
                    aria-label="Focus session length"
                  >
                    {[25, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className={LABEL}>Day start</span>
                  <select
                    className={field}
                    value={settings.planStartHour}
                    onChange={(e) => patch({ planStartHour: Number(e.target.value) })}
                    aria-label="Workday start hour"
                  >
                    {[6, 7, 8, 9, 10, 11].map((h) => (
                      <option key={h} value={h}>{h === 12 ? 'Noon' : `${h}:00`}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LABEL}>Daily pace</span>
                  <input
                    type="number" min={1} max={8} step={1}
                    className={field}
                    value={settings.dailyPaceTarget}
                    onChange={(e) => patch({ dailyPaceTarget: Math.max(1, Math.min(8, Number(e.target.value) || 1)) })}
                    aria-label="Daily tasks target"
                  />
                </label>
              </div>
              <p className="text-xs leading-relaxed text-tx-500">
                The planner weights your day around the chosen start hour and pace target — the pace value is the number
                of operations it tries to schedule per day.
              </p>
            </CardBody>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={rise}>
          <Card>
            <CardHeader eyebrow={<><Bell className="h-3 w-3" aria-hidden /> Alerts</>} title="Notifications" />
            <CardBody className="space-y-2 pt-2">
              <Toggle
                checked={settings.notifications.missionReminders}
                onChange={(v) => patch({ notifications: { ...settings.notifications, missionReminders: v } })}
                label="Mission reminders"
                description="Remind me when a started mission is unattended."
              />
              <Toggle
                checked={settings.notifications.streakWarnings}
                onChange={(v) => patch({ notifications: { ...settings.notifications, streakWarnings: v } })}
                label="Streak warnings"
                description="Warn before a day streak is at risk."
              />
              <Toggle
                checked={settings.notifications.replanAlerts}
                onChange={(v) => patch({ notifications: { ...settings.notifications, replanAlerts: v } })}
                label="Replan alerts"
                description="Notify when the planner proposes to reschedule."
              />
              <Toggle
                checked={settings.notifications.riskEscalations}
                onChange={(v) => patch({ notifications: { ...settings.notifications, riskEscalations: v } })}
                label="Risk escalations"
                description="Flags when a deadline shifts into HIGH or CRITICAL."
              />
            </CardBody>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={rise}>
          <Card>
            <CardHeader eyebrow={<><Palette className="h-3 w-3" aria-hidden /> Display</>} title="Appearance" />
            <CardBody className="space-y-2 pt-2">
              <Toggle
                checked={settings.appearance.glowEffects}
                onChange={(v) => patch({ appearance: { ...settings.appearance, glowEffects: v } })}
                label="Glow effects"
                description="Keep the neon command-glow on accents and focuses."
              />
              <Toggle
                checked={settings.appearance.reducedMotion}
                onChange={(v) => patch({ appearance: { ...settings.appearance, reducedMotion: v } })}
                label="Reduce motion"
                description="Disable animations and transitions beyond your OS setting."
              />
              <Toggle
                checked={settings.appearance.compactDensity}
                onChange={(v) => patch({ appearance: { ...settings.appearance, compactDensity: v } })}
                label="Compact density"
                description="Tighten card padding to fit more per screen."
              />
            </CardBody>
          </Card>
        </motion.div>

        {/* Productivity */}
        <motion.div variants={rise}>
          <Card>
            <CardHeader eyebrow={<><SlidersHorizontal className="h-3 w-3" aria-hidden /> Behavior</>} title="Productivity defaults" />
            <CardBody className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={LABEL}>Default priority</span>
                  <select
                    className={field}
                    value={settings.productivity.defaultPriority}
                    onChange={(e) => patch({ productivity: { ...settings.productivity, defaultPriority: Number(e.target.value) } })}
                    aria-label="Default priority"
                  >
                    {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>P{p}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className={LABEL}>Idle reminder</span>
                  <select
                    className={field}
                    value={settings.productivity.idleReminderMinutes}
                    onChange={(e) => patch({ productivity: { ...settings.productivity, idleReminderMinutes: Number(e.target.value) } })}
                    aria-label="Idle reminder interval"
                  >
                    {[10, 20, 30, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </label>
              </div>
              <Toggle
                checked={settings.productivity.autoReplanOnSlip}
                onChange={(v) => patch({ productivity: { ...settings.productivity, autoReplanOnSlip: v } })}
                label="Auto-replan on slip"
                description="Let the planner reshuffle the schedule the moment a task slips."
              />
            </CardBody>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={rise}>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-tx-600">
          <Sparkles className="h-3 w-3" aria-hidden />
          Appearance flags ({settings.appearance.glowEffects ? 'glow on' : 'flat'}, {settings.appearance.reducedMotion ? 'motion reduced' : 'motion default'}, {settings.appearance.compactDensity ? 'compact' : 'relaxed'}) are applied live.
        </p>
      </motion.div>
    </motion.div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-3 w-32 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-48 animate-pulse rounded bg-ink-700" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-ink-800/80" />)}
      </div>
    </div>
  )
}