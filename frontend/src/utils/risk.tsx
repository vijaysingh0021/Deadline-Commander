/* Risk presentation metadata — label + color + glyph.
   Status is ALWAYS carried by text + icon, never color alone (a11y). */

import type { RiskLevel } from '@/types'

export interface RiskMeta {
  label: string
  text: string
  hex: string
  bar: string
  glow: string
  chipBg: string
  solid: string
  glyph: string
}

export const RISK_META: Record<RiskLevel, RiskMeta> = {
  SAFE: {
    label: 'SAFE',
    text: 'text-safe-500',
    hex: '#3dd68c',
    bar: 'bg-safe-500',
    glow: 'shadow-[0_0_20px_rgba(61,214,140,0.25)]',
    chipBg: 'bg-safe-500/10',
    solid: 'bg-safe-500',
    glyph: '◆',
  },
  WARNING: {
    label: 'WARNING',
    text: 'text-warn-500',
    hex: '#f5b941',
    bar: 'bg-warn-500',
    glow: 'shadow-[0_0_20px_rgba(245,185,65,0.22)]',
    chipBg: 'bg-warn-500/10',
    solid: 'bg-warn-500',
    glyph: '▲',
  },
  HIGH: {
    label: 'HIGH RISK',
    text: 'text-high-500',
    hex: '#f98f3c',
    bar: 'bg-high-500',
    glow: 'shadow-[0_0_20px_rgba(249,143,60,0.25)]',
    chipBg: 'bg-high-500/10',
    solid: 'bg-high-500',
    glyph: '▨',
  },
  CRITICAL: {
    label: 'CRITICAL',
    text: 'text-crit-500',
    hex: '#f24e3e',
    bar: 'bg-crit-500',
    glow: 'shadow-[0_0_22px_rgba(242,78,62,0.3)]',
    chipBg: 'bg-crit-500/10',
    solid: 'bg-crit-500',
    glyph: '▲',
  },
}

/** Risk spectrum ordered lowest → highest risk for the radar. */
export const RISK_LADDER: RiskLevel[] = ['SAFE', 'WARNING', 'HIGH', 'CRITICAL']

export function riskMeta(level: RiskLevel): RiskMeta {
  return RISK_META[level]
}