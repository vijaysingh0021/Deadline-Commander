import { Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { MissionFlow } from '@/components/missions/MissionFlow'
import { fadeSwap } from '@/animations'

export function AppShell() {
  const location = useLocation()
  return (
    <div className="flex h-screen h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" className="app-grid game-shell relative flex-1 overflow-y-auto">
          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={fadeSwap}
                initial="initial"
                animate="enter"
                exit="exit"
                className="min-h-[70vh]"
              >
                <Suspense fallback={<PageFallback />}>
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <MobileNav />
      <MissionFlow />
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
