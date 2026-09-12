import type { AttributeMap } from '@/types'

export function commanderRank(level: number) {
  if (level >= 12) return { name: 'Grand Strategist', tone: 'text-gold-400' }
  if (level >= 8) return { name: 'Deadline Warden', tone: 'text-xp-500' }
  if (level >= 5) return { name: 'Tactical Commander', tone: 'text-command-300' }
  if (level >= 3) return { name: 'Mission Operative', tone: 'text-safe-500' }
  return { name: 'Cadet', tone: 'text-tx-300' }
}

export function combatPower(attributes: AttributeMap, level: number, streak: number) {
  const attributeTotal = Object.values(attributes).reduce((total, value) => total + value, 0)
  return Math.round(attributeTotal + level * 25 + Math.min(streak, 30) * 4)
}
