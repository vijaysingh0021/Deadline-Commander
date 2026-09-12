/* ─────────────────────────────────────────────────────────
   Deadline Commander · Domain model
   These types mirror the future backend contract so the
   mock layer and UI can swap to VITE_API_URL seamlessly.
   ───────────────────────────────────────────────────────── */

export type RiskLevel = 'SAFE' | 'WARNING' | 'HIGH' | 'CRITICAL'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type MissionStatus = 'available' | 'in_progress' | 'paused' | 'completed' | 'abandoned'
export type Zone = 'MORNING' | 'AFTERNOON' | 'EVENING'
export type ScheduleKind = 'mission' | 'task' | 'break' | 'personal'
export type PlanAction = 'shift' | 'raise' | 'lower' | 'add' | 'drop'

export interface AttributeMap {
  FOCUS: number
  DISCIPLINE: number
  EXECUTION: number
  KNOWLEDGE: number
  PLANNING: number
}

export interface Skill {
  id: string
  name: string
  description: string
  tier: number
  prerequisite?: string
  unlocked: boolean
  icon: string
}

export interface Profile {
  name: string
  title: string
  level: number
  xp: number
  xpToNext: number
  streak: number
  gold: number
  attributes: AttributeMap
  skills: Skill[]
  createdAt: string
}

export interface Deadline {
  id: string
  title: string
  subject: string
  dueDate: string // ISO
  targetEndDate?: string // ISO — when finishing above the deadline counts as "early"
  progress: number // 0–100
  effortHours: number // total remaining effort estimate
  paceHoursPerDay: number // hours/day the user can actually burn
  lockedBy?: string // dependency id blocking this deadline
  blurb: string
}

export interface Milestone {
  id: string
  deadlineId: string
  name: string
  order: number
  progress: number
  done: boolean
  bossDamage: number // percent of deadline boss HP this milestone clears
  xpReward: number
}

export interface Task {
  id: string
  deadlineId: string
  milestoneId?: string
  title: string
  status: TaskStatus
  estimatedMinutes: number
  minutesDone: number
  priority: number // 1..5
  criticalPath: boolean
  dependsOn?: string
  costToReschedule?: number // minutes shifted away when replanning
}

export interface Mission {
  id: string
  deadlineId: string
  taskId: string
  brief: string
  status: MissionStatus
  estimatedMinutes: number
  elapsedSessionSeconds: number
  xpReward: number
  attributeRewards: Partial<AttributeMap>
  createdAt: string
}

export interface MissionNext {
  mission: Mission
  deadline: Deadline
  risk: RiskAssessment
  recommendedNext: string
}

/** High-level objective a commander sets — rolls up linked tasks. */
export type GoalStatus = 'active' | 'completed'

export interface Goal {
  id: string
  title: string
  description: string
  priority: number // 1..5
  progress: number // 0–100 (fallback when no linked tasks)
  dueDate?: string // ISO
  deadlineId?: string // linked deadline for context
  linkedTasks: string[] // task ids contributing to this goal
  status: GoalStatus
  completedAt?: string
  createdAt: string
}

export interface RiskAssessment {
  level: RiskLevel
  score: number // 0–100
  workloadRemainingHours: number
  availableHours: number
  blockers: string[]
  why: string
}

export interface PlanBlock {
  id: string
  deadlineId?: string
  missionId?: string
  zone: Zone
  start: string // HH:mm
  title: string
  kind: ScheduleKind
  minutes: number
  priority: number
  risk?: RiskLevel
  progress?: number
  locked: boolean
}

export interface PlanChange {
  kind: PlanAction
  deltaMinutes?: number
  target: string
  detail: string
}

export interface ReplanProposal {
  id: string
  reason: string
  missed: string
  changes: PlanChange[]
  totalShiftedMinutes: number
  finalDeadlineChanged: boolean
  timestamp: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress: number // 0–100
  progressNow: number
  progressTarget: number
}

export interface RewardItem {
  id: string
  name: string
  description: string
  priceGold: number
  owned: boolean
  equipped: boolean
  effect: string
  strength: number // visual tier 1..3
}

export interface ActivityEvent {
  id: string
  kind: 'mission' | 'milestone' | 'achievement' | 'level' | 'plan' | 'risk' | 'reward' | 'goal' | 'profile'
  title: string
  detail: string
  at: string
  deltaXp?: number
  level?: number
}

export interface AnalystReport {
  weekLabel: string
  hoursCompleted: number
  executionEfficiency: number
  deadlineSuccessRate: number
  completionRate: number
  bestWindow: { from: string; to: string; note: string }
  productivity: { label: string; hours: number }[] // per weekday
  plannedVsActual: { day: string; planned: number; actual: number }[]
  riskTrend: { day: string; avgRisk: number }[]
  hotSpot: { kind: string; title: string; where: string }
  styleNote: string
}

export interface Toast {
  id: string
  kind: 'mission' | 'plan' | 'risk' | 'level' | 'reward' | 'info' | 'error'
  title: string
  detail?: string
}

/* ── Identifiers for the query layer ───────────────────────── */
export interface CommanderSnapshot {
  profile: Profile
  goals: Goal[]
  deadlines: Deadline[]
  milestones: Milestone[]
  tasks: Task[]
  missions: Mission[]
  plan: PlanBlock[]
  replan: ReplanProposal | null
  achievements: Achievement[]
  rewards: RewardItem[]
  activity: ActivityEvent[]
  report: AnalystReport
}

/** Current mission derived for the dashboard / mission screen. */
export interface LiveMission {
  mission: Mission | null
  assessment: RiskAssessment | null
  recommendedNext: string | null
  bossHealth: number | null
}