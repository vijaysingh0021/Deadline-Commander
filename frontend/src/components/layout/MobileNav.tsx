import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'
import { MOBILE_PRIMARY, MOBILE_SECONDARY } from '@/components/layout/nav'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils'

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  const go = (to: string) => {
    setMoreOpen(false)
    navigate(to)
  }

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-ink-900/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="grid grid-cols-5">
          {MOBILE_PRIMARY.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wide transition-colors',
                  isActive ? 'text-command-300' : 'text-tx-500',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span layoutId="mobile-nav-dot" className="absolute top-0 h-0.5 w-8 rounded-full bg-command-400" />
                  ) : null}
                  <item.icon className="h-5 w-5" aria-hidden />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
          {/* More */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className="flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wide text-tx-500"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            More
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Command" size="sm" sheet>
        <p className="mb-3 text-xs text-tx-500">Progression, rewards and insights.</p>
        <div className="grid grid-cols-2 gap-2">
          {MOBILE_SECONDARY.map((item) => (
            <button
              key={item.to}
              onClick={() => go(item.to)}
              className="flex flex-col items-center gap-2 rounded-xl border border-line-soft bg-ink-800 px-3 py-4 text-tx-300 transition-colors hover:border-command-500/40 hover:text-command-300"
            >
              <item.icon className="h-5 w-5" aria-hidden />
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}