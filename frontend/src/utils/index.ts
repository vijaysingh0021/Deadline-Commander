/* Class-name combiner — keeps tailwind usage tidy without a dependency.
   Accepts strings, falsy values, and conditional objects {cls: bool}. */
export function cn(...parts: Array<string | false | null | undefined | Record<string, boolean | null | undefined>>): string {
  const out: string[] = []
  for (const p of parts) {
    if (!p) continue
    if (typeof p === 'string') {
      out.push(p)
    } else {
      for (const [k, v] of Object.entries(p)) {
        if (v) out.push(k)
      }
    }
  }
  return out.join(' ')
}

/** Format seconds as MM:SS (or H:MM:SS past an hour) — tactical timer readout. */
export function fmtDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** Relative "due" phrasing: "Due today", "Due tomorrow", "Due in 4 days", "Overdue". */
export function duePhrase(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now
  const days = Math.ceil(diff / 86_400_000)
  if (days <= 0) return 'Overdue'
  if (days === 1) return 'Due tomorrow'
  if (days === 0) return 'Due today'
  return `Due in ${days} days`
}

export function minutesLabel(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }
  return `${min} min`
}

/** Tiny wait so skeleton→content comes in at a perceivable cadence on fast mocks. */
export function withMinDelay<T>(promise: Promise<T>, min = 240): Promise<T> {
  return Promise.all([promise, new Promise((r) => setTimeout(r, min))]).then(([v]) => v)
}