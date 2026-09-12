import { useEffect, useState, useRef } from 'react'

/** Media query hook — used for intentional breakpoint behavior. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')

/** Monotonic timer that ticks every second, exposed as total seconds. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/** Global key binding, cleaned up on unmount. */
export function useHotkey(key: string, handler: () => void, enabled = true) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === key && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        handlerRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, enabled])
}

/** Escape key subscription (closes modals / exits focus mode). */
export function useEscape(handler: () => void, enabled = true) {
  useHotkey('Escape', handler, enabled)
}

/** Returns ref for focus trapping minimal dialogs: focuses container on mount. */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const node = ref.current
    if (node) {
      const current = document.activeElement as HTMLElement | null
      node.focus()
      current?.blur()
    }
  }, [])
  return ref
}

/** Persisted boolean preference with JSON safety — used for sidebar + reduced UI prefs. */
export function usePersistedState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  const set = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      try {
        localStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        /* ignore */
      }
      return resolved
    })
  }
  return [value, set]
}