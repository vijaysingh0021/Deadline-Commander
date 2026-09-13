/* ─────────────────────────────────────────────────────────
   Deadline Commander · Session & identity
   In live mode (VITE_API_URL set) this talks to the real
   backend: register/login return a JWT stored alongside the
   local session. In demo mode it stays a lightweight mock
   sign-in so /login and /signup are real routes.
   ───────────────────────────────────────────────────────── */

export interface Session {
  commander: string
  title: string
  signedInAt: string
  token?: string
  email?: string
  userId?: string
}

const SESSION_KEY = 'dc.session.v1'
export const API_BASE = import.meta.env?.VITE_API_URL as string | undefined
export const IS_LIVE = Boolean(API_BASE)

/* ── Local session helpers ────────────────────────────────── */

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (parsed && parsed.commander) return parsed
  } catch {
    return null
  }
  return null
}

export function isAuthed(): boolean {
  return loadSession() !== null
}

export function persistSession(session: Session): Session {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }
  return session
}

export function signIn(commander: string, title: string): Session {
  return persistSession({ commander, title, signedInAt: new Date().toISOString() })
}

export function signOut(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

/* ── Live backend auth ────────────────────────────────────── */

async function request<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE) throw new Error('Live mode requires VITE_API_URL')
  const res = await fetch(`${API_BASE}/api/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Auth failed (${res.status})`)
  return data as T
}

export async function apiLogin(email: string, password: string): Promise<Session> {
  const data = await request<{ token: string; user: { username: string } }>('/login', { email, password })
  return persistSession({
    commander: data.user.username,
    title: 'DEADLINE HUNTER',
    signedInAt: new Date().toISOString(),
    token: data.token,
    email,
  })
}

export async function apiRegister(username: string, email: string, password: string): Promise<Session> {
  const data = await request<{ token: string; user: { username: string } }>('/register', { username, email, password })
  return persistSession({
    commander: data.user.username,
    title: 'DEADLINE HUNTER',
    signedInAt: new Date().toISOString(),
    token: data.token,
    email,
  })
}

export async function requestAccessCodeReset(email: string): Promise<{ message: string; developmentToken?: string }> {
  return request('/forgot-password', { email })
}

export async function resetAccessCode(token: string, password: string): Promise<void> {
  await request('/reset-password', { token, password })
}

export function authToken(): string | null {
  return loadSession()?.token ?? null
}
