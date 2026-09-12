/* ─────────────────────────────────────────────────────────
   Deadline Commander · API adapter
   Today: runs the command brain over the local DB (live demo).
   Tomorrow: when VITE_API_URL is set, these calls hit the real
   backend through the same interface — the UI never changes.
   ───────────────────────────────────────────────────────── */

import { db, derive, registerSyncHook, type Derived } from '@/services/db'
import { applyXp, attributeGain, buildReplan, xpForMission, progressFromTasks, bossHealth } from '@/services/brain'
import { authToken, IS_LIVE } from '@/services/auth'
import type {
  ActivityEvent,
  CommanderSnapshot,
  Goal,
  Mission,
  PlanBlock,
  Profile,
  ReplanProposal,
  Task,
} from '@/types'

const API_BASE = import.meta.env?.VITE_API_URL as string | undefined
const LATENCY = 340

function simulate<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), 80 + Math.random() * LATENCY))
}

/* ── Live sync (backend persistence) ──────────────────────── */

/** Upload the current snapshot to the backend. Fire-and-forget; debounced. */
let syncTimer: ReturnType<typeof setTimeout> | null = null
function pushSnapshot(snapshot: CommanderSnapshot) {
  if (!IS_LIVE) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const token = authToken()
    if (!token) return
    fetch(`${API_BASE}/api/snapshot`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ snapshot }),
    }).catch(() => {
      /* offline — local DB remains the source of truth for now */
    })
  }, 1200)
}

/** Download the backend snapshot after signing in. Returns null when none exists yet. */
export async function pullSnapshot(): Promise<CommanderSnapshot | null> {
  if (!IS_LIVE) return null
  const token = authToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${API_BASE}/api/snapshot`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Snapshot fetch failed (${res.status})`)
  const data = (await res.json()) as { hasSnapshot: boolean; snapshot?: CommanderSnapshot }
  return data.hasSnapshot && data.snapshot ? data.snapshot : null
}

/** Replace the local DB with the server snapshot (first login / cross-device restore). */
export async function hydrateFromBackend(snapshot: CommanderSnapshot): Promise<void> {
  db.save(snapshot)
}

// Register the local→remote sync hook from the start.
registerSyncHook(pushSnapshot)

function read(): CommanderSnapshot {
  return db.load()
}

function logEvent(s: CommanderSnapshot, kind: ActivityEvent['kind'], title: string, detail: string, deltaXp?: number, level?: number) {
  s.activity.unshift({ id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, title, detail, at: new Date().toISOString(), deltaXp, level })
  s.activity.length = Math.min(s.activity.length, 120)
}

/** Keep medals tied to verified in-app behavior rather than static seed values. */
function refreshAchievements(s: CommanderSnapshot) {
  const now = Date.now()
  const completedMissions = s.missions.filter((mission) => mission.status === 'completed').length
  const completedDeadlines = s.deadlines.filter((deadline) => deadline.progress >= 100).length
  const earlyVictories = s.deadlines.filter((deadline) => deadline.progress >= 100 && new Date(deadline.dueDate).getTime() > now).length
  const brokenMilestones = s.milestones.filter((milestone) => milestone.done).length
  const replansAccepted = s.activity.filter((event) => event.kind === 'plan' && event.title === 'NEW PLAN ACCEPTED').length
  const progressById: Record<string, number> = {
    'ach-1': completedMissions,
    'ach-2': completedDeadlines,
    'ach-3': earlyVictories,
    'ach-4': s.profile.streak,
    'ach-5': brokenMilestones,
    'ach-6': replansAccepted,
  }

  for (const achievement of s.achievements) {
    const current = progressById[achievement.id]
    if (current === undefined) continue
    const wasUnlocked = achievement.unlocked
    achievement.progressNow = current
    achievement.progress = Math.min(100, Math.round((current / achievement.progressTarget) * 100))
    achievement.unlocked = current >= achievement.progressTarget
    if (achievement.unlocked && !wasUnlocked) {
      achievement.unlockedAt = new Date().toISOString()
      logEvent(s, 'achievement', `ACHIEVEMENT UNLOCKED — ${achievement.name}`, achievement.description)
    }
  }
}

/* ── Query surface ──────────────────────────────────────────── */

export async function fetchDerived(): Promise<Derived> {
  return simulate(derive(read()))
}

export async function fetchProfile(): Promise<Profile> {
  return simulate(read().profile)
}

export async function fetchActivity(): Promise<ActivityEvent[]> {
  return simulate(read().activity)
}

export async function fetchPlan(): Promise<PlanBlock[]> {
  const s = read()
  if (s.plan.length === 0) {
    s.plan = assemblePlanLazy(s)
    db.save(s)
  }
  return simulate(s.plan)
}

function assemblePlanLazy(s: CommanderSnapshot): PlanBlock[] {
  const open = s.tasks.filter((t) => t.status !== 'done').sort((a, b) => b.priority - a.priority)
  const out: PlanBlock[] = []
  const cursor = new Date()
  cursor.setHours(9, 0, 0, 0)
  const start = cursor.getTime()
  let at = start

  const zoneFor = (ms: number): PlanBlock['zone'] => {
    const h = new Date(ms).getHours()
    if (h < 12) return 'MORNING'
    if (h < 17) return 'AFTERNOON'
    return 'EVENING'
  }
  const push = (minutes: number, kind: PlanBlock['kind'], title: string, extra: Partial<PlanBlock> = {}) => {
    out.push({
      id: `blk-${out.length}`,
      start: toHHMM(at),
      title,
      kind,
      minutes: Math.max(minutes, 10),
      priority: 1,
      locked: true,
      zone: zoneFor(at),
      ...extra,
    })
    at += Math.max(minutes, 10) * 60_000
  }

  push(30, 'personal', 'Morning review', { zone: 'MORNING' })
  for (const t of open.slice(0, 5)) {
    const mission = s.missions.find((m) => m.taskId === t.id)
    push(t.estimatedMinutes, mission ? 'mission' : 'task', t.title, {
      deadlineId: t.deadlineId,
      missionId: mission?.id,
      priority: t.priority,
      risk: 'HIGH',
      progress: t.estimatedMinutes ? Math.min(100, Math.round((t.minutesDone / t.estimatedMinutes) * 100)) : 0,
      locked: false,
    })
    if (at - start > 4.2 * 3_600_000 && zoneFor(at) === 'AFTERNOON') {
      push(45, 'break', 'Lunch & recovery', { zone: 'AFTERNOON' })
    }
  }
  push(35, 'personal', 'Deep-breath buffer', {})
  push(20, 'personal', 'Evening review & plan tomorrow', {})
  return out
}

function toHHMM(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* ── Mutation surface ───────────────────────────────────────── */

export interface CompleteMissionResult {
  snapshot: CommanderSnapshot
  missionTitle: string
  xpGained: number
  levelsGained: number
  newLevel: number
  attributeDelta: Partial<Profile['attributes']>
  newStreak: number
  bossFrom: number | null
  bossTo: number | null
  milestoneDefeated: string | null
  nextAction: string
  leveledUp: boolean
}

/**
 * Completing a mission:
 *  - marks its task done, advances deadline progress
 *  - awards XP (+ milestone XP if the task's last sibling just closed a milestone)
 *  - raises attributes, streak, and level (possibly multiple)
 *  - drops the deadline's boss HP when a milestone is defeated
 */
export function completeMission(missionId: string, skillBoost = false): CompleteMissionResult {
  const s = read()

  const mission = s.missions.find((m) => m.id === missionId)
  if (!mission) throw new Error('Mission not found')
  const task = s.tasks.find((t) => t.id === mission.taskId)
  const deadline = s.deadlines.find((d) => d.id === mission.deadlineId)
  const priority = task?.priority ?? 1

  // 1. Task + progress
  mission.status = 'completed'
  if (task) {
    task.status = 'done'
    task.minutesDone = task.estimatedMinutes
  }
  if (deadline) deadline.progress = progressFromTasks(s.tasks, deadline.id)

  const bossFrom = deadline ? bossHealth(deadline, s.milestones) : null

  // 2. Milestone defeat: all tasks of the milestone done?
  let milestoneDefeated: string | null = null
  let milestoneXp = 0
  if (task?.milestoneId) {
    const milestone = s.milestones.find((m) => m.id === task.milestoneId)
    if (milestone && !milestone.done) {
      const siblings = s.tasks.filter((t) => t.milestoneId === milestone.id && t.deadlineId === milestone.deadlineId)
      const allDone = siblings.every((t) => t.status === 'done')
      if (allDone) {
        milestone.done = true
        milestone.progress = 100
        milestoneDefeated = milestone.name
        milestoneXp = milestone.xpReward
      }
    }
  }

  const bossTo = deadline ? bossHealth(deadline, s.milestones) : null // recomputed after milestone flip

  // 3. XP: base (+ skill boost) + milestone
  let xp = mission.xpReward + milestoneXp
  if (skillBoost) xp += mission.xpReward * 0.5
  xp = Math.round(xp)

  const beforeLevel = s.profile.level
  const lvl = applyXp(s.profile, xp)
  s.profile.xp = lvl.remainingXp
  s.profile.level = lvl.finalLevel
  const levelsGained = lvl.levelsGained
  s.profile.streak += 1

  // 4. Attributes — the completed mission trains the character
  const delta = attributeGain(priority)
  Object.entries(delta).forEach(([k, v]) => {
    const key = k as keyof Profile['attributes']
    s.profile.attributes[key] = Math.min(100, Math.max(5, s.profile.attributes[key] + (v ?? 0)))
  })

  // 5. Activity log
  logEvent(s, 'mission', mission.brief, `+${xp} XP · streak ${s.profile.streak}d`, xp)
  if (milestoneDefeated && deadline) {
    logEvent(s, 'milestone', `MILESTONE DEFEATED — ${milestoneDefeated}`, `${deadline.title} boss ${bossFrom}% → ${bossTo}% · +${milestoneXp} XP`, milestoneXp)
  }
  if (levelsGained > 0) {
    logEvent(s, 'level', `LEVEL UP — ${beforeLevel} → ${s.profile.level}`, 'New rank: DEADLINE HUNTER', undefined, s.profile.level)
  }
  refreshAchievements(s)

  db.save(s)

  const nextAction = deadline
    ? `Review "${deadline.title}" error handling, then close the last critical task.`
    : 'Plan the next mission to keep momentum.'

  return {
    snapshot: s,
    missionTitle: mission.brief,
    xpGained: xp,
    levelsGained,
    newLevel: s.profile.level,
    attributeDelta: delta,
    newStreak: s.profile.streak,
    bossFrom,
    bossTo,
    milestoneDefeated,
    nextAction,
    leveledUp: levelsGained > 0,
  }
}

export async function proposeReplan(missedTaskTitle: string): Promise<ReplanProposal> {
  const s = read()
  const task = s.tasks.find((t) => t.title.toLowerCase().includes(missedTaskTitle.toLowerCase())) ?? s.tasks[0]
  const assessments = derive(s).riskByDeadline
  const proposal = buildReplan(task, s.deadlines, assessments, s.plan)
  s.replan = proposal
  logEvent(s, 'plan', 'PLAN INTERRUPTED', proposal.reason)
  db.save(s)
  return simulate(proposal)
}

export async function acceptReplan(): Promise<Derived> {
  const s = read()
  if (!s.replan) return derive(s)
  logEvent(s, 'plan', 'NEW PLAN ACCEPTED', 'Your schedule was automatically adjusted.')
  refreshAchievements(s)
  db.save(s)
  return simulate(derive(s))
}

export async function applyNextAction(moveMinutes: number, from: string, to: string): Promise<Derived> {
  const s = read()
  const source = s.deadlines.find((d) => d.title === from)
  const target = s.deadlines.find((d) => d.title === to)
  if (source) source.effortHours = Math.max(0.5, source.effortHours - moveMinutes / 60)
  if (target) target.effortHours = Math.max(1, target.effortHours + moveMinutes / 60)
  logEvent(s, 'plan', 'TIME REALLOCATED', `${moveMinutes} min freed from "${from}" → "${to}"`)
  db.save(s)
  return simulate(derive(s))
}

export async function setMissionStatus(missionId: string, status: Mission['status']): Promise<Derived> {
  const s = read()
  s.missions.forEach((m) => {
    if (m.id !== missionId && (m.status === 'in_progress' || m.status === 'paused')) m.status = 'available'
  })
  const m = s.missions.find((x) => x.id === missionId)
  if (m) {
    m.status = status
    if (status === 'available') m.elapsedSessionSeconds = 0
  }
  db.save(s)
  return simulate(derive(s))
}

export async function buyReward(rewardId: string): Promise<{ ok: boolean; goldLeft: number; name: string }> {
  const s = read()
  const r = s.rewards.find((x) => x.id === rewardId)
  if (!r || r.owned || s.profile.gold < r.priceGold) {
    return { ok: false, goldLeft: s.profile.gold, name: r?.name ?? '' }
  }
  s.profile.gold -= r.priceGold
  r.owned = true
  logEvent(s, 'reward', r.name, `Acquired · ${r.priceGold} gold`)
  db.save(s)
  return { ok: true, goldLeft: s.profile.gold, name: r.name }
}

/* ── Goals ──────────────────────────────────────────────────── */

export interface GoalInput {
  title: string
  description: string
  priority: number
  dueDate?: string
  deadlineId?: string
  linkedTasks: string[]
}

/** Roll up linked-task completion into a live goal progress %. */
function goalProgress(s: CommanderSnapshot, g: Goal): number {
  if (g.linkedTasks.length === 0) return g.progress
  const done = g.linkedTasks.filter((id) => {
    const t = s.tasks.find((x) => x.id === id)
    return t?.status === 'done' || (t !== undefined && t.estimatedMinutes > 0 && t.minutesDone >= t.estimatedMinutes)
  })
  const pct = Math.round((done.length / g.linkedTasks.length) * 100)
  return Math.max(g.progress, pct)
}

export async function fetchGoals(): Promise<Goal[]> {
  const s = read()
  return simulate(s.goals.map((g) => ({ ...g, progress: goalProgress(s, g) })))
}

export async function createGoal(input: GoalInput): Promise<Derived> {
  const s = read()
  const draft: Goal = {
    id: `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
    deadlineId: input.deadlineId,
    linkedTasks: input.linkedTasks,
    progress: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  s.goals.push(draft)
  logEvent(s, 'goal', 'GOAL SET — INTERCEPT', draft.title)
  db.save(s)
  return simulate(derive(s))
}

export async function updateGoal(goalId: string, input: Partial<GoalInput>): Promise<Derived> {
  const s = read()
  const g = s.goals.find((x) => x.id === goalId)
  if (!g) throw new Error('Goal not found')
  const prior = g.title
  Object.assign(g, input)
  if (input.title) logEvent(s, 'goal', 'GOAL UPDATED', `${prior} → ${g.title}`)
  db.save(s)
  return simulate(derive(s))
}

export async function deleteGoal(goalId: string): Promise<Derived> {
  const s = read()
  const g = s.goals.find((x) => x.id === goalId)
  s.goals = s.goals.filter((x) => x.id !== goalId)
  if (g) logEvent(s, 'goal', 'GOAL ABANDONED', g.title)
  db.save(s)
  return simulate(derive(s))
}

export async function toggleGoal(goalId: string): Promise<Derived> {
  const s = read()
  const g = s.goals.find((x) => x.id === goalId)
  if (!g) throw new Error('Goal not found')
  const completing = g.status !== 'completed'
  g.status = completing ? 'completed' : 'active'
  if (completing) {
    g.progress = 100
    g.completedAt = new Date().toISOString()
    logEvent(s, 'goal', 'GOAL COMPLETED', g.title)
  } else {
    g.completedAt = undefined
    logEvent(s, 'goal', 'GOAL REOPENED', g.title)
  }
  db.save(s)
  return simulate(derive(s))
}

/* ── Tasks / operations board ──────────────────────────────── */

export interface TaskInput {
  deadlineId: string
  title: string
  estimatedMinutes: number
  priority: number
}

export async function createTask(input: TaskInput): Promise<Derived> {
  const s = read()
  const n = s.tasks.length + 1
  const task: Task = {
    id: `t-new-${Date.now().toString(36)}-${n}`,
    deadlineId: input.deadlineId,
    title: input.title,
    status: 'todo',
    estimatedMinutes: input.estimatedMinutes,
    minutesDone: 0,
    priority: input.priority,
    criticalPath: false,
  }
  s.tasks.push(task)
  s.missions.push({
    id: `msn-new-${Date.now().toString(36)}-${n}`,
    deadlineId: input.deadlineId,
    taskId: task.id,
    brief: input.title,
    status: 'available',
    estimatedMinutes: input.estimatedMinutes,
    elapsedSessionSeconds: 0,
    xpReward: xpForMission(input.priority, input.estimatedMinutes),
    attributeRewards: attributeGain(input.priority),
    createdAt: new Date().toISOString(),
  })
  logEvent(s, 'plan', 'OPERATION ENLISTED', `New task: ${input.title}`)
  db.save(s)
  return simulate(derive(s))
}

export async function updateTask(
  taskId: string,
  patch: Partial<Pick<Task, 'title' | 'estimatedMinutes' | 'priority' | 'status' | 'deadlineId'>>,
): Promise<Derived> {
  const s = read()
  const task = s.tasks.find((t) => t.id === taskId)
  if (!task) throw new Error('Task not found')
  const oldDeadlineId = task.deadlineId
  Object.assign(task, patch)
  if (patch.title || patch.estimatedMinutes) {
    const mission = s.missions.find((m) => m.taskId === taskId)
    if (mission) {
      if (patch.title) mission.brief = patch.title
      if (patch.estimatedMinutes) mission.estimatedMinutes = task.estimatedMinutes
    }
  }
  // Re-homing to another deadline: move the linked mission too, unlink any
  // milestone that belongs to the old deadline, and recompute both deadlines' progress.
  if (patch.deadlineId && patch.deadlineId !== oldDeadlineId) {
    const mission = s.missions.find((m) => m.taskId === taskId)
    if (mission) mission.deadlineId = task.deadlineId
    if (task.milestoneId) task.milestoneId = undefined
    for (const did of [oldDeadlineId, task.deadlineId]) {
      const dl = s.deadlines.find((d) => d.id === did)
      if (dl) dl.progress = progressFromTasks(s.tasks, did)
    }
  }
  db.save(s)
  return simulate(derive(s))
}

export async function deleteTask(taskId: string): Promise<Derived> {
  const s = read()
  const task = s.tasks.find((t) => t.id === taskId)
  s.tasks = s.tasks.filter((t) => t.id !== taskId)
  s.missions = s.missions.filter((m) => m.taskId !== taskId)
  if (task) {
    const deadline = s.deadlines.find((d) => d.id === task.deadlineId)
    if (deadline) deadline.progress = progressFromTasks(s.tasks, deadline.id)
    logEvent(s, 'plan', 'OPERATION REMOVED', task.title)
  }
  db.save(s)
  return simulate(derive(s))
}

/** Mark a task done. Uses the full mission ceremony when a mission exists. */
export async function completeTask(taskId: string): Promise<Derived> {
  const s = read()
  const task = s.tasks.find((t) => t.id === taskId)
  if (!task) throw new Error('Task not found')
  const mission = s.missions.find((m) => m.taskId === taskId)
  if (mission && mission.status !== 'completed') {
    // full ceremony — XP, streak, attributes, milestone HP (ceremony saves internally)
    completeMission(mission.id)
    return simulate(derive(read()))
  }
  if (task.status === 'done') return simulate(derive(s))
  task.status = 'done'
  task.minutesDone = task.estimatedMinutes
  const deadline = s.deadlines.find((d) => d.id === task.deadlineId)
  if (deadline) deadline.progress = progressFromTasks(s.tasks, deadline.id)
  if (task.milestoneId) {
    const milestone = s.milestones.find((m) => m.id === task.milestoneId)
    if (milestone && !milestone.done) {
      const siblings = s.tasks.filter((t) => t.milestoneId === milestone.id && t.deadlineId === milestone.deadlineId)
      if (siblings.every((t) => t.status === 'done')) {
        milestone.done = true
        milestone.progress = 100
      }
    }
  }
  logEvent(s, 'mission', task.title, 'Task completed from the operations board')
  db.save(s)
  return simulate(derive(s))
}

/** Toggle between todo and in_progress (operations board when no mission flow exists). */
export async function flipTaskStatus(taskId: string, next: 'todo' | 'in_progress'): Promise<Derived> {
  return updateTask(taskId, { status: next })
}

/* ── Profile ────────────────────────────────────────────────── */

export async function updateProfile(patch: Partial<Pick<Profile, 'name' | 'title'>>): Promise<Derived> {
  const s = read()
  Object.assign(s.profile, patch)
  logEvent(s, 'profile', 'IDENTITY UPDATED', patch.name ?? patch.title ?? 'Profile edited')
  db.save(s)
  return simulate(derive(s))
}

/** Levels-up helper exposed for the skill tree preview (no persistence). */
export function levelCost(level: number): number {
  // mirrors brain.xpNeededForLevel without re-import in hot paths
  return Math.round(140 * Math.pow(1.15, level - 1))
}

export function resetDemo(): CommanderSnapshot {
  return db.reset()
}

export function isLiveMode() {
  return IS_LIVE
}

export function makeXp(priority: number, minutes: number) {
  return xpForMission(priority, minutes)
}
