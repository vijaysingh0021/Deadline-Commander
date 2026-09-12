import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronsLeft, ChevronsRight, ShieldCheck } from 'lucide-react'
import { NAV_ITEMS, GROUP_LABELS } from '@/components/layout/nav'
import { useUi } from '@/stores/ui'
import { useIsDesktop, useHotkey } from '@/hooks/useMediaQuery'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/utils'

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-command-500 to-command-700 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path d="M6 8 L12 2 L18 8 L15.5 8 L15.5 19 L8.5 19 L8.5 8 Z" fill="#0b0e13" />
          <rect x="11" y="9.5" width="2" height="7" rx="1" fill="#0b0e13" />
        </svg>
      </span>
      {!collapsed ? (
        <div className="min-w-0 leading-none">
          <div className="truncate font-display text-[15px] font-bold tracking-[0.08em] text-tx-100">DEADLINE</div>
          <div className="truncate font-display text-[11px] font-semibold tracking-[0.42em] text-command-300/90">COMMANDER</div>
        </div>
      ) : null}
    </div>
  )
}

function NavEntry({ to, label, icon: Icon, exact, collapsed }: { to: string; label: string; icon: typeof NAV_ITEMS[number]['icon']; exact?: boolean; collapsed: boolean }) {
  const link = (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold tracking-tight transition-colors',
          collapsed ? 'justify-center' : '',
          isActive ? 'bg-command-500/10 text-command-300' : 'text-tx-500 hover:bg-ink-800 hover:text-tx-200',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('relative flex h-5 w-5 items-center justify-center', isActive ? 'text-command-300' : 'text-tx-500 group-hover:text-tx-300')}>
            {isActive ? (
              <motion.span layoutId="side-active" className="absolute -left-3 h-4 w-[3px] rounded-r bg-command-400" />
            ) : null}
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
          {!collapsed ? <span className="truncate">{label}</span> : null}
        </>
      )}
    </NavLink>
  )
  return collapsed ? (
    <Tooltip label={label}>{link}</Tooltip>
  ) : (
    link
  )
}

export function Sidebar() {
  const collapsed = useUi((s) => s.sidebarCollapsed)
  const setCollapsed = useUi((s) => s.setSidebarCollapsed)
  const desktop = useIsDesktop()
  const effectiveCollapsed = collapsed && desktop

  useHotkey('\\', () => setCollapsed(!collapsed), desktop)

  const groups = [...new Set(NAV_ITEMS.map((n) => n.group))].filter((g) => g !== 'settings')

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line-soft bg-ink-900/70 backdrop-blur-xl lg:flex',
          'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          effectiveCollapsed ? 'w-[76px]' : 'w-[256px]',
        )}
        aria-label="Primary navigation"
      >
        <div className={cn('flex h-[64px] items-center border-b border-line-soft', effectiveCollapsed ? 'justify-center px-0' : 'px-5')}>
          <BrandMark collapsed={effectiveCollapsed} />
        </div>

        <nav className={cn('flex-1 space-y-6 overflow-y-auto py-5', effectiveCollapsed ? 'px-3' : 'px-3')}>
          {groups.map((g) => (
            <div key={g}>
              {!effectiveCollapsed ? (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-tx-600">{GROUP_LABELS[g]}</p>
              ) : (
                <div className="mb-2 h-px bg-line-soft" />
              )}
              <div className="space-y-0.5">
                {NAV_ITEMS.filter((n) => n.group === g).map((n) => (
                  <NavEntry key={n.to} {...n} collapsed={effectiveCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn('space-y-0.5 border-t border-line-soft py-4', effectiveCollapsed ? 'px-3' : 'px-3')}>
          {NAV_ITEMS.filter((n) => n.group === 'settings').map((n) => (
            <NavEntry key={n.to} {...n} collapsed={effectiveCollapsed} />
          ))}
        </div>

        <div className="flex items-center border-t border-line-soft p-2">
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className={cn('w-full justify-start', effectiveCollapsed ? 'justify-center px-2' : 'px-3')}
            aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {effectiveCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!effectiveCollapsed ? <span>Collapse</span> : null}
          </Button>
        </div>
      </aside>

      {/* Tablet rail */}
      {!desktop ? (
        <aside className="sticky top-0 z-30 hidden h-dvh w-[76px] shrink-0 flex-col border-r border-line-soft bg-ink-900/70 backdrop-blur-xl md:flex lg:hidden" aria-label="Compact navigation">
          <div className="flex h-[64px] items-center justify-center border-b border-line-soft">
            <BrandMark collapsed />
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map((n) => (
              <NavEntry key={n.to} {...n} collapsed />
            ))}
          </nav>
          <div className="flex flex-col items-center border-t border-line-soft py-3">
            <ShieldCheck className="h-4 w-4 text-tx-600" aria-hidden />
          </div>
        </aside>
      ) : null}
    </>
  )
}