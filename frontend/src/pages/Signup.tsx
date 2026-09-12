/* ─────────────────────────────────────────────────────────
   Deadline Commander · Enlist
   In live mode this creates a real account (server-side,
   hashed password) and seeds the first snapshot. Demo mode
   records callsign + rank locally only.
   ───────────────────────────────────────────────────────── */

import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Grid3x3, ShieldCheck, Loader2 } from 'lucide-react'
import { apiRegister, signIn, IS_LIVE } from '@/services/auth'
import { hydrateFromBackend } from '@/services/api'
import { db } from '@/services/db'
import { useToast } from '@/stores/toast'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'

const field =
  'h-11 w-full rounded-lg border border-line bg-ink-900/70 px-3.5 text-sm text-tx-100 placeholder:text-tx-600 ' +
  'focus:border-command-500/60 focus:outline-none'

const RANKS = ['Field Commander', 'Tactical Officer', 'Logistics Specialist', 'Analyst', 'Liberator'] as const

export function SignupPage() {
  const navigate = useNavigate()
  const toast = useToast((s) => s.push)
  const [commander, setCommander] = useState('')
  const [title, setTitle] = useState<(typeof RANKS)[number]>(RANKS[0])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')

    try {
      if (IS_LIVE) {
        const session = await apiRegister(commander.trim(), email.trim(), password)
        // Seed the fresh account with the local demo workspace so every new
        // commander starts fully equipped, then push it to the server.
        await hydrateFromBackend(db.load())
        toast({
          kind: 'mission',
          title: 'WELCOME ABOARD',
          detail: `${session.commander} — ${title}. Workspace pushed to the server. Good hunting.`,
        })
      } else {
        const name = commander.trim() || 'New Commander'
        signIn(name, title)
        toast({ kind: 'mission', title: 'WELCOME ABOARD', detail: `${name} — ${title}. Good hunting.` })
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enlistment failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Initialization"
      title="Enlist"
      subtitle={
        IS_LIVE
          ? 'Carve your callsign, choose a rank, and commission your first command — your dossier persists on the server.'
          : 'Carve your callsign and choose a starting rank. Your dossier is generated on the fly.'
      }
      footer={
        <span>
          Already enlisted?{' '}
          <Link to="/login" className="font-semibold text-command-300 transition-colors hover:text-command-400">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Callsign</span>
          <input
            autoFocus
            value={commander}
            onChange={(e) => setCommander(e.target.value)}
            placeholder="e.g. Falcon-7"
            aria-label="Callsign"
            className={field}
          />
        </label>

        {IS_LIVE && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email"
                className={field}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Access code</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                aria-label="Access code"
                className={field}
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Starting rank</span>
          <select value={title} onChange={(e) => setTitle(e.target.value as (typeof RANKS)[number])} aria-label="Starting rank" className={field}>
            {RANKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">{error}</p>
        )}

        <Button
          variant="primary"
          size="lg"
          style="solid"
          className="h-11 w-full"
          disabled={(IS_LIVE ? !commander.trim() || !email.trim() || password.length < 6 : commander.trim().length === 0) || busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Grid3x3 className="h-4 w-4" aria-hidden />}
          {busy ? 'Enlisting…' : 'Deploy to command center'}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-tx-600">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          {IS_LIVE ? 'Server-side account · bcrypt hashed · snapshot persisted.' : 'Demo build — no real account is created or stored remotely.'}
        </p>
      </form>
    </AuthShell>
  )
}