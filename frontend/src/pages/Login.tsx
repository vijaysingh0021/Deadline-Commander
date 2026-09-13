/* ─────────────────────────────────────────────────────────
   Deadline Commander · Sign in
   In live mode this authenticates against the backend (JWT —
   real account, password hashing) and hydrates the local
   command DB from the saved snapshot. Demo mode accepts any
   credentials and keeps a local-only session.
   ───────────────────────────────────────────────────────── */

import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, ShieldCheck, Loader2 } from 'lucide-react'
import { apiLogin, signIn, IS_LIVE } from '@/services/auth'
import { pullSnapshot, hydrateFromBackend } from '@/services/api'
import { useToast } from '@/stores/toast'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'

const field =
  'h-11 w-full rounded-lg border border-line bg-ink-900/70 px-3.5 text-sm text-tx-100 placeholder:text-tx-600 ' +
  'focus:border-command-500/60 focus:outline-none'

export function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast((s) => s.push)
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
        // Real authentication → refresh the local DB from the saved snapshot
        const session = await apiLogin(email.trim(), password)
        let hydrated = false
        try {
          const remote = await pullSnapshot()
          if (remote) {
            await hydrateFromBackend(remote)
            hydrated = true
          }
        } catch {
          /* no snapshot yet — keep the local workspace */
        }
        toast({
          kind: 'mission',
          title: 'WELCOME BACK',
          detail: `Signed in as ${session.commander}.${hydrated ? ' Workspace restored from the server.' : ''}`,
        })
      } else {
        const name = email.trim() || 'Commander'
        signIn(name, 'Field Commander')
        toast({ kind: 'mission', title: 'WELCOME BACK', detail: `Signed in as ${name}.` })
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Authorization"
      title="Sign in"
      subtitle={
        IS_LIVE
          ? 'Returning commander — your workspace syncs from the server.'
          : 'The command center is standing by. Any callsign unlocks this demo build.'
      }
      footer={
        <span>
          New to the grid?{' '}
          <Link to="/signup" className="font-semibold text-command-300 transition-colors hover:text-command-400">
            Enlist now
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">
            {IS_LIVE ? 'Email' : 'Callsign'}
          </span>
          <input
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={IS_LIVE ? 'you@example.com' : 'e.g. Falcon-7'}
            aria-label={IS_LIVE ? 'Email' : 'Callsign'}
            className={field}
            type={IS_LIVE ? 'email' : 'text'}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Access code</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            aria-label="Access code"
            className={field}
          />
        </label>
        {IS_LIVE ? <div className="-mt-2 text-right"><Link to="/forgot-access-code" className="text-xs font-semibold text-command-300 hover:text-command-400">Forgot access code?</Link></div> : null}

        {error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">{error}</p>
        )}

        <Button
          variant="primary"
          size="lg"
          style="solid"
          className="h-11 w-full"
          disabled={(IS_LIVE ? !email.trim() || !password : email.trim().length === 0) || busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
          {busy ? 'Authenticating…' : 'Enter command center'}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-tx-600">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          {IS_LIVE ? 'Server-side auth · bcrypt hashed · JWT session.' : 'Demo build — credentials are never validated or transmitted.'}
        </p>
      </form>
    </AuthShell>
  )
}
