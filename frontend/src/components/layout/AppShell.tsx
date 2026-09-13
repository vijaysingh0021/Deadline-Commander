import { Suspense, useCallback, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { MissionFlow } from '@/components/missions/MissionFlow'
import { CommandPalette } from '@/components/layout/CommandPalette'

export function AppShell() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const resetMainScroll = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  // <main>, not window, is the persistent scroller for routed content. Reset
  // it before paint for direct navigation and once an outgoing route has left.
  useLayoutEffect(() => {
    resetMainScroll()
  }, [location.pathname, resetMainScroll])

  return (
    <div className="flex h-screen h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />
        <main ref={mainRef} id="main" className="app-grid game-shell relative min-h-0 flex-1 overflow-y-auto [overflow-anchor:none]">
          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
            {/* Page components retain their own card transitions. Keeping the
                route outlet out of AnimatePresence prevents an exiting page
                from withholding or displacing the incoming route. */}
            <div key={location.pathname} className="min-h-[70vh]">
              <Suspense fallback={<PageFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
      <MissionFlow />
      <CommandPalette />
    </div>
  )
}

function PageFallback() {
  return (
    <div className="space-y-6" aria-label="Loading">
      <div className="h-3 w-48 animate-pulse rounded bg-ink-700" />
      <div className="h-8 w-72 animate-pulse rounded bg-ink-700" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-64 animate-pulse rounded-xl bg-ink-800/80 lg:col-span-3" />
        <div className="h-64 animate-pulse rounded-xl bg-ink-800/80 lg:col-span-2" />
      </div>
    </div>
  )
}
