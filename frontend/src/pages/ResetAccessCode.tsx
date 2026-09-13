import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { resetAccessCode } from '@/services/auth'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'

const field = 'h-11 w-full rounded-lg border border-line bg-ink-900/70 px-3.5 text-sm text-tx-100 placeholder:text-tx-600 focus:border-command-500/60 focus:outline-none'

export function ResetAccessCodePage() {
  const [params] = useSearchParams(); const navigate = useNavigate()
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const token = params.get('token') ?? ''
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return
    if (!token) return setError('This reset link is missing its security token.')
    if (password.length < 8) return setError('Access code must contain at least 8 characters.')
    if (password !== confirm) return setError('Access codes do not match.')
    setBusy(true); setError('')
    try { await resetAccessCode(token, password); navigate('/login', { state: { resetComplete: true } }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to reset access code.') }
    finally { setBusy(false) }
  }
  return <AuthShell eyebrow="Recovery protocol" title="Set new access code" subtitle="Choose a new code for your commander account." footer={<Link to="/login" className="font-semibold text-command-300 hover:text-command-400">Return to sign in</Link>}>
    <form onSubmit={submit} className="space-y-4">
      <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">New access code</span><input autoFocus type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className={field} /></label>
      <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Confirm access code</span><input type="password" required minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat your access code" className={field} /></label>
      {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">{error}</p> : null}
      <Button variant="primary" size="lg" style="solid" className="h-11 w-full" disabled={busy || !token || password.length < 8 || confirm.length < 8}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}{busy ? 'Securing…' : 'Secure new access code'}</Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-tx-600"><ShieldCheck className="h-3 w-3" /> The old access code stops working immediately.</p>
    </form>
  </AuthShell>
}
