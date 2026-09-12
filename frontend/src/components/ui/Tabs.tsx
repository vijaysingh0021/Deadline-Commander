import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

export interface TabItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  badge?: ReactNode
}

/** Accessible tab strip with sliding indicator (role=tablist). */
export function Tabs({
  items,
  active,
  onChange,
  className,
  scrollable = false,
}: {
  items: TabItem[]
  active: string
  onChange: (key: string) => void
  className?: string
  scrollable?: boolean
}) {
  return (
    <div
      role="tablist"
      aria-label="Section tabs"
      className={cn(
        'flex items-end gap-1 border-b border-line-soft',
        scrollable && 'overflow-x-auto',
        className,
      )}
    >
      {items.map((it) => {
        const selected = it.key === active
        return (
          <button
            key={it.key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(it.key)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold tracking-tight transition-colors',
              selected ? 'text-tx-100' : 'text-tx-500 hover:text-tx-300',
            )}
          >
            {it.icon ? <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{it.icon}</span> : null}
            {it.label}
            {it.badge ? <span className="text-[10px] text-tx-500">{it.badge}</span> : null}
            {selected ? (
              <motion.span
                layoutId="tab-active"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-command-400"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}