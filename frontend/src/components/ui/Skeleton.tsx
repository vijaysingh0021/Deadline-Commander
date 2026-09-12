import { cn } from '@/utils'

/** Shimmer block — preserves layout so content never pops. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative overflow-hidden rounded-md bg-ink-700/60', className)}>
      <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  )
}

const block = 'bg-ink-700/60 rounded-lg'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-8 w-40" />
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-2 w-40" />
        </div>
      </div>
      {/* Mission + radar grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className={cn(block, 'h-72 lg:col-span-3')} />
        <div className={cn(block, 'h-72 lg:col-span-2')} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={cn(block, 'h-60')} />
        <div className={cn(block, 'h-60')} />
        <div className={cn(block, 'h-60')} />
      </div>
    </div>
  )
}

export function RadarSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-40" />
      <div className={cn(block, 'h-20')} />
      <div className={cn(block, 'h-16')} />
      <div className={cn(block, 'h-16')} />
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-32" />
      <div className={cn(block, 'h-10')} />
      <div className={cn(block, 'h-10')} />
      <div className={cn(block, 'h-10')} />
      <div className={cn(block, 'h-10')} />
    </div>
  )
}