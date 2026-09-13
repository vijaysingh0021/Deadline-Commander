import { useEffect, useState } from 'react'
import { Command, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { soundManager } from '@/services/soundManager'

const actions = [
  ['Command center', '/'], ['Quests', '/missions'], ['Deadlines', '/deadlines'],
  ['Calendar', '/calendar'], ['Analytics', '/analytics'], ['Achievements', '/achievements'],
  ['Character', '/character'], ['Settings', '/settings'], ['Create task', '/tasks'], ['Create deadline', '/deadlines'],
] as const

/** Keyboard-first SPA navigation. Create actions open the relevant board without a page reload. */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!open) return null
  const matches = actions.filter(([label]) => label.toLowerCase().includes(query.toLowerCase()))
  const select = (to: string) => { soundManager.play('BUTTON_CONFIRM'); setOpen(false); setQuery(''); navigate(to) }
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink-950/70 px-4 pt-[18vh] backdrop-blur-sm" role="presentation" onMouseDown={() => setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-label="Command palette" className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-ink-900 shadow-float" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3">
          <Search className="h-4 w-4 text-command-300" aria-hidden />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands…" className="min-w-0 flex-1 bg-transparent text-sm text-tx-100 outline-none placeholder:text-tx-600" />
          <button onClick={() => setOpen(false)} aria-label="Close command palette" className="rounded p-1 text-tx-500 hover:text-tx-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {matches.map(([label, to]) => <button key={`${label}-${to}`} onClick={() => select(to)} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-tx-300 hover:bg-ink-800 hover:text-command-300"><span>{label}</span><Command className="h-3.5 w-3.5 text-tx-600" /></button>)}
          {matches.length === 0 ? <p className="px-3 py-7 text-center text-sm text-tx-500">No command found.</p> : null}
        </div>
      </section>
    </div>
  )
}
