/**
 * Optional game-audio boundary. The command center ships silent; a future
 * opt-in audio adapter can subscribe here without UI owning playback details.
 */
export type SoundEvent =
  | 'MISSION_COMPLETE'
  | 'LEVEL_UP'
  | 'ACHIEVEMENT_UNLOCK'
  | 'BUTTON_CONFIRM'
  | 'WARNING'

type SoundHandler = (event: SoundEvent) => void
let handler: SoundHandler | null = null

export const soundManager = {
  configure(nextHandler: SoundHandler | null) {
    handler = nextHandler
  },
  play(event: SoundEvent) {
    handler?.(event)
  },
} as const
