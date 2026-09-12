/* ─────────────────────────────────────────────────────────
   Deadline Commander · Command Brain (rule engine)
   Simulated intelligence. Given real data the backend would
   produce, these pure functions derive risk, priorities,
   next actions, replans, and progression. No randomness —
   every recommendation is explainable.
   ───────────────────────────────────────────────────────── */

import type {
  Deadline,
  Milestone,
  Mission,
  RiskAssessment,
  ReplanProposal,
  PlanBlock,
  PlanChange,
  Task,
  Profile,
  AttributeMap,
  Zone,
} from '@/types'

/* ── Level / XP ─────────────────────────────────────────────── */

/** XP curve: cost grows ~15% per level so progression stays readable. */
export function xpNeededForLevel(level: number): number {
  return Math.round(140 * Math.pow(1.15, level - 1))
}

export interface LevelResult {
  levelsGained: number
  finalLevel: number
  remainingXp: number
  overflowXp: number
}

export function applyXp(profile: Profile, amount: number): LevelResult {
  let xp = profile.xp + amount
  let level = profile.level
  let levelsGained = 0
  while (xp >= xpNeededForLevel(level)) {
    xp -= xpNeededForLevel(level)
    level += 1
    levelsGained += 1
  }
  return { levelsGained, finalLevel: level, remainingXp: xp, overflowXp: xp }
}

/* ── Risk engine ────────────────────────────────────────────── */

const RISK_LEVELS = [
  { key: 'CRITICAL', at: 75 },
  { key: 'HIGH', at: 50 },
  { key: 'WARNING', at: 25 },
  { key: 'SAFE', at: 0 },
] as const

export function riskLevelForScore(score: number): RiskAssessment['level'] {
  for (const r of RISK_LEVELS) {
    if (score >= r.at) return r.key
  }
  return 'SAFE'
}

/**
 * Core: risk = how far pace is behind the pace needed to finish on time,
 * amplified by unresolved dependencies and low progress.
 */
export function assessRisk(
  deadline: Deadline,
  tasks: Task[],
  _milestone: Milestone | undefined,
  blockedBy: Deadline | undefined,
  now = Date.now(),
): RiskAssessment {
  const msLeft = new Date(deadline.dueDate).getTime() - now
  const daysLeft = Math.max(msLeft / 86_400_000, 0)
  const hoursPerDayOurPace = Math.max(deadline.paceHoursPerDay, 0.01)
  const maxAchievable = daysLeft * hoursPerDayOurPace

  const workload = Math.max(deadline.effortHours, 0)
  const progressRatio = deadline.progress / 100

  // Time sufficiency: can we finish at current pace?
  const timeSufficiency = maxAchievable <= 0 ? 0 : Math.max(workload / maxAchievable, 0)
  // Demanding when little time remains relative to effort.
  const urgency = Math.min(1, Math.max(0.25, 3.5 - daysLeft * 0.4))

  const doneRatio = progressRatio + 0.08 // a little credit for momentum
  const remainingRatio = Math.max(1 - doneRatio, 0.05)
  const blockers = [] as string[]

  let raw = (timeSufficiency * 58 + urgency * 18 + remainingRatio * 12)

  if (deadline.lockedBy) {
    raw += 18
    const dep = blockedBy?.dueDate
    if (dep) blockers.push(`Blocked by "${blockedBy.title}" due in ${Math.max(0, Math.ceil(daysLeft))}d`)
    else blockers.push('Awaiting upstream dependency')
  }

  const criticalMissed = tasks.some((t) => t.criticalPath && t.status !== 'done')
  if (criticalMissed) {
    raw += 8
    blockers.push('Critical-path tasks still open')
  }
  if (deadline.progress === 0) blockers.push('No progress logged yet')

  const score = Math.round(Math.min(100, Math.max(1, raw)))
  const why = buildWhy(score, workload, maxAchievable, daysLeft, blockers.length)

  return {
    level: riskLevelForScore(score),
    score,
    workloadRemainingHours: round1(workload),
    availableHours: round1(maxAchievable),
    blockers,
    why,
  }
}

function buildWhy(score: number, workload: number, available: number, daysLeft: number, blockerCount: number): string {
  if (score >= 75)
    return `Workload (${round1(workload)}h) exceeds what your pace allows before the deadline${blockerCount ? `, and ${blockerCount} blocker${blockerCount > 1 ? 's' : ''} remain` : ''}.`
  if (score >= 50)
    return `You are ${daysLeft.toFixed(1)} days out with ${round1(workload)}h of work against ${round1(available)}h of pace capacity.`
  if (score >= 25)
    return `On track, but daylight is limited — ${round1(workload)}h to go in ${daysLeft.toFixed(1)} days.`
  return 'Pace comfortably clears this deadline.'
}

/* ── Next-action recommendation ─────────────────────────────── */

export interface NextAction {
  text: string
  focus: 'mission' | 'warning'
  moveMinutes?: number
  sourceDeadline: string
  targetDeadline: string
}

export function recommendNext(
  deadlines: Deadline[],
  assessments: Map<string, RiskAssessment>,
  missions: Mission[],
): NextAction {
  const risky = [...deadlines]
    .filter((d) => assessments.get(d.id))
    .sort((a, b) => (assessments.get(b.id)?.score ?? 0) - (assessments.get(a.id)?.score ?? 0))

  const top = risky[0]
  const activeMission = missions.find((m) => m.status === 'in_progress' || m.status === 'paused')
  if (!top) return { text: 'All clear, Commander. Nothing is at risk right now.', focus: 'warning', sourceDeadline: '', targetDeadline: '' }

  const safe = risky.find((d) => (assessments.get(d.id)?.score ?? 0) < 40 && d.id !== top.id)

  if (top && safe) {
    const move = Math.min(60, safe.effortHours * 30)
    return {
      text: `Move ${Math.round(move)} min from "${safe.title}" to "${top.title}" to close the critical gap.`,
      focus: 'mission',
      moveMinutes: Math.round(move),
      sourceDeadline: safe.title,
      targetDeadline: top.title,
    }
  }

  if (activeMission) {
    return { text: `Resume "${activeMission.brief}" — highest unfinished critical work.`, focus: 'mission', sourceDeadline: '', targetDeadline: top.title }
  }

  const criticalTask = top.id
  return { text: `Attack "${criticalTask}" first — it sits on the critical path of "${top.title}".`, focus: 'mission', sourceDeadline: '', targetDeadline: top.title }
}

/* ── Replan engine ──────────────────────────────────────────── */

export function buildReplan(
  missedTask: Task,
  deadlines: Deadline[],
  assessments: Map<string, RiskAssessment>,
  plan: PlanBlock[],
): ReplanProposal {
  const changes: PlanChange[] = []
  const deadline = deadlines.find((d) => d.id === missedTask.deadlineId)

  // 1. Lower: move the missed block out of today's plan.
  const missBlock = plan.find((b) => b.id === missedTask.id)
  if (missBlock) {
    changes.push({ kind: 'lower', target: `"${missedTask.title}"`, detail: 'Reading moved to tomorrow' })
  } else {
    changes.push({ kind: 'lower', target: `"${missedTask.title}"`, detail: 'Rescheduled to a lower-priority slot' })
  }

  // 2. Raise: bump the owning deadline's remaining tasks.
  if (deadline) {
    changes.push({ kind: 'raise', target: `"${deadline.title}"`, detail: 'Priority increased' })
  }

  // 3. Add: borrow minutes from the safest deadline if there is one.
  const assessment = deadline ? assessments.get(deadline.id) : undefined
  const safe = [...deadlines]
    .filter((d) => d.id !== missedTask.deadlineId)
    .sort((a, b) => (assessments.get(a.id)?.score ?? 100) - (assessments.get(b.id)?.score ?? 100))[0]

  const addMinutes = assessment && assessment.score >= 75 ? 90 : 45
  if (safe) {
    changes.push({
      kind: 'add',
      deltaMinutes: addMinutes,
      target: `+${addMinutes} min`,
      detail: `Borrowed from "${safe.title}"`,
    })
  } else if (assessment) {
    changes.push({ kind: 'add', deltaMinutes: addMinutes, target: `+${addMinutes} min`, detail: 'Added to today’s command' })
  }

  // 4. Final deadline unchanged (we believe).
  changes.push({ kind: 'shift', target: 'Final deadline', detail: 'Unchanged', deltaMinutes: 0 })

  const reason =
    assessment && assessment.score >= 75
      ? `"${deadline?.title}" is now ${assessment.level} risk — we moved work to protect it.`
      : 'Your plan shifted to keep the highest-priority work protected.'

  return {
    id: `replan-${Date.now()}`,
    reason,
    missed: missedTask.title,
    changes,
    totalShiftedMinutes: addMinutes,
    finalDeadlineChanged: false,
    timestamp: new Date().toISOString(),
  }
}

/* ── Boss health ────────────────────────────────────────────── */

export function bossHealth(deadline: Deadline, milestones: Milestone[]): number {
  const own = milestones.filter((m) => m.deadlineId === deadline.id)
  if (own.length === 0) return deadline.progress
  const damage = own.filter((m) => m.done).reduce((acc, m) => acc + m.bossDamage, 0)
  return Math.max(0, Math.min(100, 100 - damage))
}

export function bossNextMilestone(deadlineId: string, milestones: Milestone[]) {
  return milestones
    .filter((m) => m.deadlineId === deadlineId && !m.done)
    .sort((a, b) => a.order - b.order)[0]
}

/* ── Plan assembly ──────────────────────────────────────────── */

export function assemblePlan(_deadlines: Deadline[], missions: Mission[], tasks: Task[]): PlanBlock[] {
  const blocks: PlanBlock[] = []
  const start = new Date()
  start.setHours(9, 0, 0, 0)
  let cursor = start.getTime()

  const open = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => b.priority - a.priority)

  const push = (minutes: number, kind: PlanBlock['kind'], title: string, extra: Partial<PlanBlock>) => {
    const block: PlanBlock = {
      id: `blk-${blocks.length}`,
      start: toHHMM(cursor),
      title,
      kind,
      minutes,
      priority: 1,
      locked: true,
      zone: zoneFor(cursor),
      ...extra,
    }
    const real = Math.max(minutes, 10)
    blocks.push(block)
    cursor += real * 60_000
  }

  // Breakfast/start of day
  push(40, 'personal', 'Morning review', { zone: 'MORNING' })

  for (const t of open.slice(0, 4)) {
    const mission = missions.find((m) => m.taskId === t.id)
    push(t.estimatedMinutes, mission ? 'mission' : 'task', t.title, {
      deadlineId: t.deadlineId,
      missionId: mission?.id,
      priority: t.priority,
      risk: 'HIGH',
      progress: t.minutesDone / t.estimatedMinutes,
      locked: false,
    })
    if (cursor - start.getTime() > 4.5 * 3_600_000 && zoneFor(cursor) === 'AFTERNOON') {
      push(50, 'break', 'Lunch', { zone: 'AFTERNOON' })
    }
  }

  push(45, 'personal', 'Deep-breath buffer', { zone: zoneFor(cursor) })
  push(20, 'personal', 'Evening review & plan tomorrow', { zone: 'EVENING' })
  return blocks
}

function zoneFor(ms: number): Zone {
  const h = new Date(ms).getHours()
  if (h < 12) return 'MORNING'
  if (h < 17) return 'AFTERNOON'
  return 'EVENING'
}

export function toHHMM(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ── Analytics synthesis ────────────────────────────────────── */

export function synthesizeReport(
  deadlines: Deadline[],
  missions: Mission[],
): { hoursCompleted: number; executionEfficiency: number; deadlineSuccessRate: number; completionRate: number } {
  const hoursCompleted = round1(
    missions.filter((m) => m.status === 'completed').reduce((a, m) => a + m.estimatedMinutes / 60, 0),
  )
  const finishedDeadlines = deadlines.filter((d) => d.progress >= 100).length
  const deadlineSuccessRate = deadlines.length ? Math.round((finishedDeadlines / deadlines.length) * 100) : 0
  const doneTasksRatio = 0.62 // illustrative until real task logs land
  const executionEfficiency = missions.length ? Math.round(Math.min(100, (missions.filter((m) => m.status === 'completed').length / Math.max(missions.length, 1)) * 88 + 12)) : 84
  const completionRate = Math.round(Math.min(100, doneTasksRatio * 100) )
  return { hoursCompleted, executionEfficiency, deadlineSuccessRate, completionRate }
}

/* ── XP for missions / milestones ───────────────────────────── */

export function xpForMission(priority: number, estimatedMinutes: number): number {
  return 40 + priority * 16 + Math.round(estimatedMinutes / 8)
}

/* ── Attribute gain on completion ───────────────────────────── */

export function attributeGain(priority: number): Partial<AttributeMap> {
  const execution = 1 + (priority >= 4 ? 1 : 0)
  const focus = priority >= 4 ? 0 : 1
  return { EXECUTION: execution, DISCIPLINE: 1, FOCUS: focus }
}

/* ── Small helpers ──────────────────────────────────────────── */

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function getZone(plan: PlanBlock[], zone: Zone) {
  return plan.filter((b) => b.zone === zone)
}

export function progressFromTasks(tasks: Task[], deadlineId: string): number {
  const own = tasks.filter((t) => t.deadlineId === deadlineId)
  if (!own.length) return 0
  const total = own.reduce((a, t) => a + t.estimatedMinutes, 0)
  const done = own.filter((t) => t.status === 'done').reduce((a, t) => a + t.estimatedMinutes, 0)
  return total ? Math.round((done / total) * 100) : 0
}