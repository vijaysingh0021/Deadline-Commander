/* ─────────────────────────────────────────────────────────
   Deadline Commander · Local Command DB
   A localStorage-backed store seeded with realistic data so
   the whole UX can be exercised and the command brain can run
   live. When VITE_API_URL is configured, api.ts routes to the
   real backend instead; this file is the demo/simulator mode.
   ───────────────────────────────────────────────────────── */

import type { CommanderSnapshot } from '@/types'
import {
  assessRisk,
  applyXp,
  attributeGain,
  bossHealth,
  buildReplan,
  recommendNext,
  synthesizeReport,
  xpForMission,
  xpNeededForLevel,
} from '@/services/brain'

const DB_KEY = 'deadline-commander.v1'
const SEED_VERSION = '2026-09-12'

/* ── Seed ───────────────────────────────────────────────────── */

function seed(): CommanderSnapshot {
  const now = Date.now()
  const inDays = (d: number) => new Date(now + d * 86_400_000).toISOString()

  return {
    profile: {
      name: 'Commander',
      title: 'DEADLINE HUNTER',
      level: 14,
      xp: 520,
      xpToNext: xpNeededForLevel(14),
      streak: 12,
      gold: 620,
      attributes: { FOCUS: 74, DISCIPLINE: 81, EXECUTION: 77, KNOWLEDGE: 68, PLANNING: 73 },
      skills: [
        { id: 'focus-basics', name: 'Deep Focus', description: 'Uninterrupted work sessions +15% efficiency.', tier: 1, unlocked: true, icon: 'target' },
        { id: 'plan-basics', name: 'Prioritization', description: 'Automatically rank your next moves.', tier: 1, unlocked: true, icon: 'list' },
        { id: 'nav-basics', name: 'Pace Prediction', description: 'See exactly how many hours remain.', tier: 1, unlocked: true, icon: 'clock' },
        { id: 'nav-crit', name: 'Critical Path', description: 'Never miss a blocking task again.', tier: 2, prerequisite: 'nav-basics', unlocked: true, icon: 'git' },
        { id: 'plan-crit', name: 'Risk Arbitrage', description: 'Shift time between deadlines intelligently.', tier: 2, prerequisite: 'plan-basics', unlocked: true, icon: 'scale' },
        { id: 'focus-pro', name: 'Flow Reactor', description: 'Chain missions for +50% XP.', tier: 3, prerequisite: 'focus-basics', unlocked: false, icon: 'zap' },
        { id: 'plan-pro', name: 'Time Master', description: 'Plans self-heal around interruptions.', tier: 3, prerequisite: 'plan-crit', unlocked: false, icon: 'hourglass' },
        { id: 'nav-pro', name: 'Deadline Oracle', description: 'Predict slip risk 7 days out.', tier: 3, prerequisite: 'nav-crit', unlocked: false, icon: 'crystal' },
      ],
      createdAt: inDays(-45),
    },
    goals: [
      {
        id: 'goal-dbms-api',
        title: 'Ship the DBMS REST API',
        description: 'Wire the controller to the service layer and land a passing endpoint test suite.',
        priority: 5,
        progress: 45,
        dueDate: inDays(2),
        deadlineId: 'dl-dbms',
        linkedTasks: ['t-dbms-c', 't-dbms-t', 't-dbms-e'],
        status: 'active',
        createdAt: inDays(-14),
      },
      {
        id: 'goal-web-devlog',
        title: 'Publish the Week 2 devlog',
        description: 'Document the architecture experiments and capture fresh screenshots.',
        priority: 3,
        progress: 30,
        dueDate: inDays(5),
        deadlineId: 'dl-web',
        linkedTasks: ['t-web-1', 't-web-2'],
        status: 'active',
        createdAt: inDays(-10),
      },
      {
        id: 'goal-os-labs',
        title: 'Close all OS lab reports',
        description: 'Finish the outstanding write-ups so the practical block is fully submitted.',
        priority: 4,
        progress: 25,
        dueDate: inDays(8),
        deadlineId: 'dl-os',
        linkedTasks: ['t-os-1'],
        status: 'active',
        createdAt: inDays(-20),
      },
      {
        id: 'goal-dsa-set',
        title: 'Complete DSA problem set 6',
        description: 'Graph algorithms — pathfinding and flow problems, all solved and reviewed.',
        priority: 2,
        progress: 100,
        dueDate: inDays(11),
        deadlineId: 'dl-dsa',
        linkedTasks: [],
        status: 'completed',
        completedAt: inDays(-1),
        createdAt: inDays(-21),
      },
    ],
    deadlines: [
      {
        id: 'dl-dbms',
        title: 'DBMS Project',
        subject: 'Database Systems',
        dueDate: inDays(2),
        progress: 42,
        effortHours: 8,
        paceHoursPerDay: 3.5,
        blurb: 'Relational schema, indexing strategy and the API integration layer.',
      },
      {
        id: 'dl-web',
        title: 'Web Engineering Devlog',
        subject: 'Advanced Web Engineering',
        dueDate: inDays(5),
        progress: 64,
        effortHours: 5,
        paceHoursPerDay: 2,
        blurb: 'Weekly devlog documenting architecture decisions and experiments.',
      },
      {
        id: 'dl-os',
        title: 'OS Practical Report',
        subject: 'Operating Systems',
        dueDate: inDays(8),
        progress: 20,
        effortHours: 7,
        paceHoursPerDay: 2.5,
        blurb: 'Lab write-ups and scheduling-simulation results.',
      },
      {
        id: 'dl-dsa',
        title: 'DSA Problem Set 6',
        subject: 'Data Structures & Algorithms',
        dueDate: inDays(11),
        progress: 85,
        effortHours: 3,
        paceHoursPerDay: 1.5,
        blurb: 'Graph algorithms — the last three problems remain.',
      },
    ],
    milestones: [
      { id: 'ms-dbms-1', deadlineId: 'dl-dbms', name: 'Schema + ERD', order: 1, progress: 100, done: true, bossDamage: 22, xpReward: 80 },
      { id: 'ms-dbms-2', deadlineId: 'dl-dbms', name: 'Indexing strategy', order: 2, progress: 70, done: false, bossDamage: 18, xpReward: 90 },
      { id: 'ms-dbms-3', deadlineId: 'dl-dbms', name: 'REST API integration', order: 3, progress: 30, done: false, bossDamage: 30, xpReward: 150 },
      { id: 'ms-dbms-4', deadlineId: 'dl-dbms', name: 'Test suite + docs', order: 4, progress: 0, done: false, bossDamage: 30, xpReward: 120 },
      { id: 'ms-web-1', deadlineId: 'dl-web', name: 'Week 1 entry', order: 1, progress: 100, done: true, bossDamage: 50, xpReward: 70 },
      { id: 'ms-web-2', deadlineId: 'dl-web', name: 'Week 2 entry', order: 2, progress: 30, done: false, bossDamage: 50, xpReward: 70 },
      { id: 'ms-os-1', deadlineId: 'dl-os', name: 'Lab 1–3 write-ups', order: 1, progress: 40, done: false, bossDamage: 60, xpReward: 90 },
      { id: 'ms-os-2', deadlineId: 'dl-os', name: 'Simulation analysis', order: 2, progress: 0, done: false, bossDamage: 40, xpReward: 90 },
      { id: 'ms-dsa-1', deadlineId: 'dl-dsa', name: 'Pathfinding problems', order: 1, progress: 90, done: false, bossDamage: 70, xpReward: 80 },
      { id: 'ms-dsa-2', deadlineId: 'dl-dsa', name: 'Flow + matching', order: 2, progress: 50, done: false, bossDamage: 30, xpReward: 80 },
    ],
    tasks: [
      { id: 't-dbms-c', deadlineId: 'dl-dbms', milestoneId: 'ms-dbms-3', title: 'Connect controller to service layer', status: 'todo', estimatedMinutes: 40, minutesDone: 0, priority: 5, criticalPath: true, dependsOn: 't-dbms-b' },
      { id: 't-dbms-b', deadlineId: 'dl-dbms', milestoneId: 'ms-dbms-2', title: 'Configure REST routes', status: 'done', estimatedMinutes: 30, minutesDone: 30, priority: 5, criticalPath: true },
      { id: 't-dbms-a', deadlineId: 'dl-dbms', milestoneId: 'ms-dbms-1', title: 'Design schema', status: 'done', estimatedMinutes: 50, minutesDone: 50, priority: 4, criticalPath: true },
      { id: 't-dbms-t', deadlineId: 'dl-dbms', milestoneId: 'ms-dbms-3', title: 'Test endpoints (Postman)', status: 'todo', estimatedMinutes: 45, minutesDone: 0, priority: 5, criticalPath: true, dependsOn: 't-dbms-c' },
      { id: 't-dbms-e', deadlineId: 'dl-dbms', milestoneId: 'ms-dbms-4', title: 'Handle error responses', status: 'todo', estimatedMinutes: 30, minutesDone: 0, priority: 4, criticalPath: true, dependsOn: 't-dbms-c' },
      { id: 't-web-1', deadlineId: 'dl-web', milestoneId: 'ms-web-2', title: 'Draft Week 2 architecture section', status: 'in_progress', estimatedMinutes: 60, minutesDone: 18, priority: 2, criticalPath: false },
      { id: 't-web-2', deadlineId: 'dl-web', milestoneId: 'ms-web-2', title: 'Capture experiment screenshots', status: 'todo', estimatedMinutes: 35, minutesDone: 0, priority: 1, criticalPath: false },
      { id: 't-os-1', deadlineId: 'dl-os', milestoneId: 'ms-os-1', title: 'Finish Lab 3 report', status: 'in_progress', estimatedMinutes: 80, minutesDone: 30, priority: 3, criticalPath: false },
      { id: 't-dsa-6', deadlineId: 'dl-dsa', milestoneId: 'ms-dsa-1', title: 'Solve problem 6b (flow)', status: 'todo', estimatedMinutes: 90, minutesDone: 0, priority: 2, criticalPath: false },
    ],
    missions: [
      { id: 'msn-1', deadlineId: 'dl-dbms', taskId: 't-dbms-c', brief: 'Connect controller to service layer', status: 'available', estimatedMinutes: 40, elapsedSessionSeconds: 0, xpReward: xpForMission(5, 40), attributeRewards: attributeGain(5), createdAt: inDays(-0.2) },
      { id: 'msn-2', deadlineId: 'dl-dbms', taskId: 't-dbms-t', brief: 'Test endpoints (Postman)', status: 'available', estimatedMinutes: 45, elapsedSessionSeconds: 0, xpReward: xpForMission(5, 45), attributeRewards: attributeGain(5), createdAt: inDays(-0.2) },
      { id: 'msn-3', deadlineId: 'dl-dbms', taskId: 't-dbms-e', brief: 'Handle error responses', status: 'available', estimatedMinutes: 30, elapsedSessionSeconds: 0, xpReward: xpForMission(4, 30), attributeRewards: attributeGain(4), createdAt: inDays(-0.2) },
      { id: 'msn-4', deadlineId: 'dl-web', taskId: 't-web-1', brief: 'Draft Week 2 architecture section', status: 'available', estimatedMinutes: 60, elapsedSessionSeconds: 0, xpReward: xpForMission(2, 60), attributeRewards: attributeGain(2), createdAt: inDays(-0.4) },
    ],
    plan: [],
    replan: null,
    achievements: [
      { id: 'ach-1', name: 'FIRST COMMAND', description: 'Complete your first mission.', icon: 'flag', unlocked: true, unlockedAt: inDays(-30), progress: 100, progressNow: 1, progressTarget: 1 },
      { id: 'ach-2', name: 'DEADLINE SLAYER', description: 'Complete 10 deadlines.', icon: 'swords', unlocked: false, progress: 40, progressNow: 4, progressTarget: 10 },
      { id: 'ach-3', name: 'EARLY VICTORY', description: 'Finish 5 deadlines early.', icon: 'timer', unlocked: false, progress: 20, progressNow: 1, progressTarget: 5 },
      { id: 'ach-4', name: 'CONSISTENT COMMANDER', description: 'Maintain a 7-day streak.', icon: 'flame', unlocked: true, unlockedAt: inDays(-6), progress: 100, progressNow: 12, progressTarget: 7 },
      { id: 'ach-5', name: 'MILESTONE BREAKER', description: 'Defeat 10 boss milestones.', icon: 'crosshair', unlocked: false, progress: 30, progressNow: 3, progressTarget: 10 },
      { id: 'ach-6', name: 'TACTICIAN', description: 'Accept 5 replans from the advisor.', icon: 'brain', unlocked: false, progress: 20, progressNow: 1, progressTarget: 5 },
    ],
    rewards: [
      { id: 'rw-1', name: 'Streak Shield', description: 'Protects one missed day from breaking your streak.', priceGold: 250, owned: true, equipped: true, effect: 'Missed-day protection', strength: 2 },
      { id: 'rw-2', name: 'XP Booster Chip', description: '+25% XP for the next 5 missions.', priceGold: 400, owned: false, equipped: false, effect: '+25% XP · 5 missions', strength: 2 },
      { id: 'rw-3', name: 'Pace Accelerator', description: 'Raises daily pace capacity by 30 minutes.', priceGold: 300, owned: false, equipped: false, effect: '+30 min pace / day', strength: 1 },
      { id: 'rw-4', name: 'Focus Serum', description: 'Free 25 minutes of command focus, banked.', priceGold: 150, owned: false, equipped: false, effect: 'Banked focus', strength: 1 },
      { id: 'rw-5', name: 'Time Vault', description: 'Pause a deadline once without penalty.', priceGold: 600, owned: false, equipped: false, effect: 'One-time delay', strength: 3 },
    ],
    activity: [],
    report: {
      weekLabel: 'THIS WEEK',
      hoursCompleted: 0,
      executionEfficiency: 0,
      deadlineSuccessRate: 0,
      completionRate: 0,
      bestWindow: { from: '17:00', to: '20:00', note: 'You perform best between 5 PM and 8 PM.' },
      productivity: [
        { label: 'MON', hours: 3.2 },
        { label: 'TUE', hours: 4.1 },
        { label: 'WED', hours: 2.8 },
        { label: 'THU', hours: 5.0 },
        { label: 'FRI', hours: 3.6 },
        { label: 'SAT', hours: 1.8 },
        { label: 'SUN', hours: 1.2 },
      ],
      plannedVsActual: [
        { day: 'MON', planned: 3.5, actual: 3.1 },
        { day: 'TUE', planned: 4, actual: 4.3 },
        { day: 'WED', planned: 3, actual: 2.6 },
        { day: 'THU', planned: 4.5, actual: 5.2 },
        { day: 'FRI', planned: 3.5, actual: 3.6 },
        { day: 'SAT', planned: 2, actual: 1.6 },
        { day: 'SUN', planned: 1.5, actual: 1.2 },
      ],
      riskTrend: [
        { day: 'MON', avgRisk: 34 },
        { day: 'TUE', avgRisk: 41 },
        { day: 'WED', avgRisk: 52 },
        { day: 'THU', avgRisk: 63 },
        { day: 'FRI', avgRisk: 58 },
        { day: 'SAT', avgRisk: 49 },
        { day: 'SUN', avgRisk: 61 },
      ],
      hotSpot: { kind: 'high', title: 'DBMS Project', where: 'REST API integration' },
      styleNote: 'Long, uninterrupted blocks win you more than many small tasks. Protect your evening window.',
    },
  }
}

/* ── Load / persist ─────────────────────────────────────────── */

function read(): CommanderSnapshot {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      const s = seed()
      persist(s)
      return s
    }
    const parsed = JSON.parse(raw) as CommanderSnapshot
    if (parsed && 'profile' in parsed) return parsed
    return seed()
  } catch {
    return seed()
  }
}

function persist(snapshot: CommanderSnapshot) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(snapshot))
  } catch {
    /* storage unavailable — app still works in-memory */
  }
  syncHooks.forEach((hook) => {
    try {
      hook(snapshot)
    } catch {
      /* remote sync failure must never break the local UX */
    }
  })
}

/** Registered by api.ts in live mode: pushes each save to the backend snapshot API. */
const syncHooks: Array<(snapshot: CommanderSnapshot) => void> = []
export function registerSyncHook(hook: (snapshot: CommanderSnapshot) => void): () => void {
  syncHooks.push(hook)
  return () => {
    const i = syncHooks.indexOf(hook)
    if (i >= 0) syncHooks.splice(i, 1)
  }
}

export const db = {
  load: read,
  save: persist,
  seedVersion: SEED_VERSION,
  reset(): CommanderSnapshot {
    const s = seed()
    persist(s)
    return s
  },
}

/* ── Derived snapshot + live wiring ─────────────────────────── */

export interface Derived {
  snapshot: CommanderSnapshot
  riskByDeadline: Map<string, ReturnType<typeof assessRisk>>
  nextAction: ReturnType<typeof recommendNext>
  boss: Map<string, number>
  replan: ReturnType<typeof buildReplan> | null
  stats: ReturnType<typeof synthesizeReport>
}

export function derive(snapshot: CommanderSnapshot): Derived {
  const tasks = snapshot.tasks.map((t) => t)
  const riskByDeadline = new Map<string, ReturnType<typeof assessRisk>>()
  for (const d of snapshot.deadlines) {
    const blocked = d.lockedBy ? snapshot.deadlines.find((x) => x.id === d.lockedBy) : undefined
    const milestone = snapshot.milestones.find((m) => m.deadlineId === d.id && m.order === 2)
    riskByDeadline.set(d.id, assessRisk(d, tasks.filter((t) => t.deadlineId === d.id), milestone, blocked))
  }
  const nextAction = recommendNext(snapshot.deadlines, riskByDeadline, snapshot.missions)
  const boss = new Map(snapshot.deadlines.map((d) => [d.id, bossHealth(d, snapshot.milestones)]))
  const stats = synthesizeReport(snapshot.deadlines, snapshot.missions)
  return { snapshot, riskByDeadline, nextAction, boss, replan: snapshot.replan, stats }
}

export function computeXpResult(snapshot: CommanderSnapshot, amount: number) {
  return applyXp(snapshot.profile, amount)
}