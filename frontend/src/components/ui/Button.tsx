import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'xp'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'
export type ButtonStyle = 'solid' | 'outline' | 'subtle'

const base =
  'relative inline-flex items-center justify-center gap-2 font-semibold tracking-tight whitespace-nowrap select-none ' +
  'transition-[background,color,border-color,box-shadow,transform] duration-150 ' +
  'disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-command-500 ' +
  'rounded-lg'

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-md',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  xl: 'h-14 px-7 text-base',
}

const variants: Record<ButtonVariant, Record<ButtonStyle, string>> = {
  primary: {
    solid:
      'bg-command-500 text-ink-950 hover:bg-command-400 shadow-[0_0_0_1px_rgba(45,226,195,0.4),0_8px_24px_-8px_var(--color-command-glow-strong)] ' +
      'hover:shadow-[0_0_28px_-6px_var(--color-command-glow-strong)] active:scale-[0.98]',
    outline:
      'text-command-300 border border-command-500/40 hover:border-command-500 hover:bg-command-500/10 active:scale-[0.98] bg-transparent',
    subtle: 'bg-command-500/12 text-command-300 hover:bg-command-500/20 active:scale-[0.98]',
  },
  secondary: {
    solid: 'bg-ink-700 text-tx-100 hover:bg-ink-600 border border-line shadow-lift active:scale-[0.98]',
    outline: 'border border-line text-tx-300 hover:border-tx-400 hover:text-tx-100 hover:bg-ink-800/60 active:scale-[0.98] bg-transparent',
    subtle: 'bg-ink-700/50 text-tx-300 hover:bg-ink-700 hover:text-tx-100 active:scale-[0.98]',
  },
  ghost: {
    solid: 'text-tx-400 hover:text-tx-100 hover:bg-ink-700/70 active:scale-[0.98] bg-transparent',
    outline: 'text-tx-300 hover:text-tx-100 bg-transparent hover:bg-ink-700/50',
    subtle: 'text-tx-400 hover:text-tx-100 hover:bg-ink-700/50',
  },
  danger: {
    solid: 'bg-crit-500/90 text-white hover:bg-crit-500 shadow-[0_0_0_1px_rgba(242,78,62,0.4)] active:scale-[0.98]',
    outline: 'border border-crit-500/50 text-crit-500 hover:bg-crit-500/10 hover:border-crit-500 active:scale-[0.98] bg-transparent',
    subtle: 'bg-crit-500/10 text-crit-500 hover:bg-crit-500/20 active:scale-[0.98]',
  },
  warning: {
    solid: 'bg-warn-500 text-ink-950 hover:bg-[--color-warn-500]/90 shadow-[0_0_0_1px_rgba(245,185,65,0.4)] active:scale-[0.98]',
    outline: 'border border-warn-500/50 text-warn-500 hover:bg-warn-500/10 active:scale-[0.98] bg-transparent',
    subtle: 'bg-warn-500/10 text-warn-500 hover:bg-warn-500/20 active:scale-[0.98]',
  },
  xp: {
    solid: 'bg-xp-500/15 text-xp-500 border border-xp-500/40 hover:bg-xp-500/25 active:scale-[0.98] backdrop-blur-sm',
    outline: 'border border-xp-500/40 text-xp-500 hover:bg-xp-500/10',
    subtle: 'bg-xp-500/10 text-xp-500 hover:bg-xp-500/20',
  },
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children' | 'style'> {
  variant?: ButtonVariant
  /** Cosmetic style. Precedence: explicit `style` prop, then the convenience booleans. */
  style?: ButtonStyle
  solid?: boolean
  outline?: boolean
  subtle?: boolean
  size?: ButtonSize
  children?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', style, solid, outline, subtle, size = 'md', className, children, disabled, ...rest },
  ref,
) {
  const resolvedStyle: ButtonStyle = style ?? (subtle ? 'subtle' : outline ? 'outline' : solid ? 'solid' : 'solid')
  return (
    <motion.button
      ref={ref}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cn(base, sizes[size], variants[variant][resolvedStyle], className)}
      disabled={disabled}
      data-variant={variant}
      {...(rest as HTMLMotionProps<'button'>)}
    >
      {children}
    </motion.button>
  )
})

export interface IconBtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
  label: string
}

/** Compact square icon button with accessible label. */
export const IconButton = forwardRef<HTMLButtonElement, IconBtnProps>(function IconButton(
  { className, label, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-tx-400 transition-colors',
        'hover:text-tx-100 hover:bg-ink-700/80 active:scale-95 disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})