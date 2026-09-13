import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MissionFocus } from '@/components/missions/MissionFocus'
import { MissionCompletion } from '@/components/missions/MissionCompletion'
import { LevelUpOverlay } from '@/components/missions/LevelUp'
import { useCompleteMission } from '@/hooks/useCommand'
import { useUi } from '@/stores/ui'
import type { CompleteMissionResult } from '@/services/api'
import { soundManager } from '@/services/soundManager'

/**
 * Orchestrates the whole mission experience:
 *   focus mode → completion sequence → level-up → landing back on the dashboard.
 * Mounted once in the app shell; it reads the shared focus state.
 */
export function MissionFlow() {
  const focus = useUi((s) => s.focus)
  const setFocus = useUi((s) => s.setFocus)
  const navigate = useNavigate()
  const [result, setResult] = useState<CompleteMissionResult | null>(null)
  const [phase, setPhase] = useState<'complete' | 'levelup' | null>(null)

  const complete = useCompleteMission((r) => {
    setResult(r)
    setPhase('complete')
  })

  const activeMissionId = focus.phase === 'running' || focus.phase === 'paused' ? focus.missionId : undefined

  // scrub the result when opening a fresh mission
  useEffect(() => {
    if (activeMissionId) {
      setResult(null)
      setPhase(null)
    }
  }, [activeMissionId])

  useEffect(() => {
    if (result && phase === 'complete') soundManager.play('MISSION_COMPLETE')
    if (result && phase === 'levelup') soundManager.play('LEVEL_UP')
  }, [phase, result])

  if (focus.phase === 'idle' && phase === null) return null

  const exit = () => {
    setFocus({ phase: 'idle' })
    setResult(null)
    setPhase(null)
    navigate('/')
  }

  const missionId = focus.phase === 'running' || focus.phase === 'paused' || focus.phase === 'completing' ? focus.missionId : undefined

  const handleComplete = () => {
    if (missionId) complete.mutate(missionId)
  }

  const continueToLevelUp = () => {
    if (result?.leveledUp) setPhase('levelup')
    else exit()
  }

  return (
    <>
      {/* Focus mode runs behind the completion overlays (calm backdrop) */}
      {(focus.phase === 'running' || focus.phase === 'paused') && phase === null ? (
        <MissionFocus missionId={focus.missionId} onComplete={handleComplete} onExit={exit} />
      ) : null}

      {result && phase === 'complete' ? (
        <MissionCompletion result={result} onContinue={continueToLevelUp} />
      ) : null}

      {result && phase === 'levelup' ? <LevelUpOverlay result={result} onContinue={exit} /> : null}
    </>
  )
}
