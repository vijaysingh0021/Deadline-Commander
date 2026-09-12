/* Shared animation language — fast, calm, consistent.
   All variants respect prefers-reduced-motion via framer-motion's
   reducedMotion="user" where applies (MotionConfig handles globally). */

import type { Variants } from 'framer-motion'

/** Fade + rise for cards entering the viewport. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
}

/** Sequencing helper: stagger child containers. */
export const stagger = (gap = 0.06): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: 0.04 } },
})

/** Quick crossfade for route transitions. */
export const fadeSwap: Variants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: 'easeIn' } },
}

/** XP streak-fly-up numbers. */
export const flyUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.3, 0.4, 1] } },
}

/** Modal panel entrance. */
export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } },
}

/** Backdrop fade. */
export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
}

/** Expansion for accordions / expanding rows. */
export const expand: Variants = {
  hidden: { opacity: 0, height: 0 },
  show: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

/** XP bar fill spring. */
export const barSpring = {
  initial: { width: '0%' },
  animate: (to: string) => ({ width: to, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 } }),
} as const