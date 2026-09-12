/* ─────────────────────────────────────────────────────────
   Deadline Commander · User settings
   Preferences live outside the command DB so they survive
   demo resets and stay cheap to read. Merged with defaults
   so old saves never break shape.
   ───────────────────────────────────────────────────────── */

export interface NotificationPrefs {
  missionReminders: boolean
  streakWarnings: boolean
  replanAlerts: boolean
  riskEscalations: boolean
}

export interface AppearancePrefs {
  glowEffects: boolean
  reducedMotion: boolean
  compactDensity: boolean
}

export interface ProductivityPrefs {
  defaultPriority: number // 1–5
  autoReplanOnSlip: boolean
  idleReminderMinutes: number
}

export interface CommanderSettings {
  focusMinutes: number
  planStartHour: number
  dailyPaceTarget: number
  notifications: NotificationPrefs
  appearance: AppearancePrefs
  productivity: ProductivityPrefs
}

const SETTINGS_KEY = 'dc.settings.v1'

export const DEFAULT_SETTINGS: CommanderSettings = {
  focusMinutes: 45,
  planStartHour: 9,
  dailyPaceTarget: 3,
  notifications: { missionReminders: true, streakWarnings: true, replanAlerts: true, riskEscalations: true },
  appearance: { glowEffects: true, reducedMotion: false, compactDensity: false },
  productivity: { defaultPriority: 3, autoReplanOnSlip: true, idleReminderMinutes: 20 },
}

function deepMerge(base: CommanderSettings, patch: Partial<CommanderSettings>): CommanderSettings {
  return {
    ...base,
    ...patch,
    notifications: { ...base.notifications, ...(patch.notifications ?? {}) },
    appearance: { ...base.appearance, ...(patch.appearance ?? {}) },
    productivity: { ...base.productivity, ...(patch.productivity ?? {}) },
  }
}

export function loadSettings(): CommanderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CommanderSettings>
      if (parsed && typeof parsed === 'object') return deepMerge(DEFAULT_SETTINGS, parsed)
    }
  } catch {
    /* corrupt storage → defaults */
  }
  return DEFAULT_SETTINGS
}

export function persistSettings(patch: Partial<CommanderSettings>): CommanderSettings {
  const next = deepMerge(loadSettings(), patch)
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable */
  }
  applyAppearance(next.appearance)
  return next
}

/** Reflect appearance toggles on the document so CSS can honor them globally. */
export function applyAppearance(a: AppearancePrefs) {
  const root = document.documentElement
  root.classList.toggle('dc-flat', !a.glowEffects)
  root.classList.toggle('dc-reduced-motion', a.reducedMotion)
  root.classList.toggle('dc-compact', a.compactDensity)
}

/** Called at startup (main.tsx) so persisted appearance applies before first paint. */
export function initAppearance() {
  applyAppearance(loadSettings().appearance)
}