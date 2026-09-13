import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Send, ShieldCheck } from 'lucide-react'
import { requestAccessCodeReset } from '@/services/auth'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/Button'

const field = 'h-11 w-full rounded-lg border border-line bg-ink-900/70 px-3.5 text-sm text-tx-100 placeholder:text-tx-600 focus:border-command-500/60 focus:outline-none'

export function ForgotAccessCodePage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [developmentToken, setDevelopmentToken] = useState<string>()
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const result = await requestAccessCodeReset(email.trim())
      setMessage(result.message)
      setDevelopmentToken(result.developmentToken)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start reset.')
    } finally { setBusy(false) }
  }

  return <AuthShell eyebrow="Recovery protocol" title="Recover access" subtitle="Enter your command email to request a secure, short-lived reset link." footer={<Link to="/login" className="font-semibold text-command-300 hover:text-command-400">Return to sign in</Link>}>
    <form onSubmit={submit} className="space-y-4">
      <label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tx-500">Command email</span><input autoFocus type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className={field} /></label>
      {message ? <div className="rounded-md border border-safe-500/30 bg-safe-500/10 px-3 py-2.5 text-xs leading-relaxed text-safe-400">{message}</div> : null}
      {developmentToken ? <Link to={`/reset-access-code?token=${developmentToken}`} className="block rounded-md border border-command-500/30 bg-command-500/10 px-3 py-2.5 text-center text-xs font-bold text-command-300 hover:bg-command-500/15">Open development reset link</Link> : null}
      {error ? <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">{error}</p> : null}
      <Button variant="primary" size="lg" style="solid" className="h-11 w-full" disabled={!email.trim() || busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{busy ? 'Sending…' : 'Request reset link'}</Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-tx-600"><ShieldCheck className="h-3 w-3" /> Reset links expire after 15 minutes.</p>
    </form>
  </AuthShell>
}
