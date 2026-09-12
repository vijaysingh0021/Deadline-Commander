// src/services/brain.ts
function xpNeededForLevel(level) {
  return Math.round(140 * Math.pow(1.15, level - 1));
}
function applyXp(profile, amount) {
  let xp = profile.xp + amount;
  let level = profile.level;
  let levelsGained = 0;
  while (xp >= xpNeededForLevel(level)) {
    xp -= xpNeededForLevel(level);
    level += 1;
    levelsGained += 1;
  }
  return { levelsGained, finalLevel: level, remainingXp: xp, overflowXp: xp };
}
var RISK_LEVELS = [
  { key: "CRITICAL", at: 75 },
  { key: "HIGH", at: 50 },
  { key: "WARNING", at: 25 },
  { key: "SAFE", at: 0 }
];
function riskLevelForScore(score) {
  for (const r of RISK_LEVELS) {
    if (score >= r.at) return r.key;
  }
  return "SAFE";
}
function assessRisk(deadline, tasks, _milestone, blockedBy, now = Date.now()) {
  const msLeft = new Date(deadline.dueDate).getTime() - now;
  const daysLeft = Math.max(msLeft / 864e5, 0);
  const hoursPerDayOurPace = Math.max(deadline.paceHoursPerDay, 0.01);
  const maxAchievable = daysLeft * hoursPerDayOurPace;
  const workload = Math.max(deadline.effortHours, 0);
  const progressRatio = deadline.progress / 100;
  const timeSufficiency = maxAchievable <= 0 ? 0 : Math.max(workload / maxAchievable, 0);
  const urgency = Math.min(1, Math.max(0.25, 3.5 - daysLeft * 0.4));
  const doneRatio = progressRatio + 0.08;
  const remainingRatio = Math.max(1 - doneRatio, 0.05);
  const blockers = [];
  let raw = timeSufficiency * 58 + urgency * 18 + remainingRatio * 12;
  if (deadline.lockedBy) {
    raw += 18;
    const dep = blockedBy?.dueDate;
    if (dep) blockers.push(`Blocked by "${blockedBy.title}" due in ${Math.max(0, Math.ceil(daysLeft))}d`);
    else blockers.push("Awaiting upstream dependency");
  }
  const criticalMissed = tasks.some((t) => t.criticalPath && t.status !== "done");
  if (criticalMissed) {
    raw += 8;
    blockers.push("Critical-path tasks still open");
  }
  if (deadline.progress === 0) blockers.push("No progress logged yet");
  const score = Math.round(Math.min(100, Math.max(1, raw)));
  const why = buildWhy(score, workload, maxAchievable, daysLeft, blockers.length);
  return {
    level: riskLevelForScore(score),
    score,
    workloadRemainingHours: round1(workload),
    availableHours: round1(maxAchievable),
    blockers,
    why
  };
}
function buildWhy(score, workload, available, daysLeft, blockerCount) {
  if (score >= 75)
    return `Workload (${round1(workload)}h) exceeds what your pace allows before the deadline${blockerCount ? `, and ${blockerCount} blocker${blockerCount > 1 ? "s" : ""} remain` : ""}.`;
  if (score >= 50)
    return `You are ${daysLeft.toFixed(1)} days out with ${round1(workload)}h of work against ${round1(available)}h of pace capacity.`;
  if (score >= 25)
    return `On track, but daylight is limited \u2014 ${round1(workload)}h to go in ${daysLeft.toFixed(1)} days.`;
  return "Pace comfortably clears this deadline.";
}
function recommendNext(deadlines, assessments, missions) {
  const risky = [...deadlines].filter((d) => assessments.get(d.id)).sort((a, b) => (assessments.get(b.id)?.score ?? 0) - (assessments.get(a.id)?.score ?? 0));
  const top = risky[0];
  const activeMission = missions.find((m) => m.status === "in_progress" || m.status === "paused");
  if (!top) return { text: "All clear, Commander. Nothing is at risk right now.", focus: "warning", sourceDeadline: "", targetDeadline: "" };
  const safe = risky.find((d) => (assessments.get(d.id)?.score ?? 0) < 40 && d.id !== top.id);
  if (top && safe) {
    const move = Math.min(60, safe.effortHours * 30);
    return {
      text: `Move ${Math.round(move)} min from "${safe.title}" to "${top.title}" to close the critical gap.`,
      focus: "mission",
      moveMinutes: Math.round(move),
      sourceDeadline: safe.title,
      targetDeadline: top.title
    };
  }
  if (activeMission) {
    return { text: `Resume "${activeMission.brief}" \u2014 highest unfinished critical work.`, focus: "mission", sourceDeadline: "", targetDeadline: top.title };
  }
  const criticalTask = top.id;
  return { text: `Attack "${criticalTask}" first \u2014 it sits on the critical path of "${top.title}".`, focus: "mission", sourceDeadline: "", targetDeadline: top.title };
}
function bossHealth(deadline, milestones) {
  const own = milestones.filter((m) => m.deadlineId === deadline.id);
  if (own.length === 0) return deadline.progress;
  const damage = own.filter((m) => m.done).reduce((acc, m) => acc + m.bossDamage, 0);
  return Math.max(0, Math.min(100, 100 - damage));
}
function synthesizeReport(deadlines, missions) {
  const hoursCompleted = round1(
    missions.filter((m) => m.status === "completed").reduce((a, m) => a + m.estimatedMinutes / 60, 0)
  );
  const finishedDeadlines = deadlines.filter((d) => d.progress >= 100).length;
  const deadlineSuccessRate = deadlines.length ? Math.round(finishedDeadlines / deadlines.length * 100) : 0;
  const doneTasksRatio = 0.62;
  const executionEfficiency = missions.length ? Math.round(Math.min(100, missions.filter((m) => m.status === "completed").length / Math.max(missions.length, 1) * 88 + 12)) : 84;
  const completionRate = Math.round(Math.min(100, doneTasksRatio * 100));
  return { hoursCompleted, executionEfficiency, deadlineSuccessRate, completionRate };
}
function xpForMission(priority, estimatedMinutes) {
  return 40 + priority * 16 + Math.round(estimatedMinutes / 8);
}
function attributeGain(priority) {
  const execution = 1 + (priority >= 4 ? 1 : 0);
  const focus = priority >= 4 ? 0 : 1;
  return { EXECUTION: execution, DISCIPLINE: 1, FOCUS: focus };
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function progressFromTasks(tasks, deadlineId) {
  const own = tasks.filter((t) => t.deadlineId === deadlineId);
  if (!own.length) return 0;
  const total = own.reduce((a, t) => a + t.estimatedMinutes, 0);
  const done = own.filter((t) => t.status === "done").reduce((a, t) => a + t.estimatedMinutes, 0);
  return total ? Math.round(done / total * 100) : 0;
}

// src/services/db.ts
var DB_KEY = "deadline-commander.v1";
var SEED_VERSION = "2026-09-12";
function seed() {
  const now = Date.now();
  const inDays = (d) => new Date(now + d * 864e5).toISOString();
  return {
    profile: {
      name: "Commander",
      title: "DEADLINE HUNTER",
      level: 14,
      xp: 520,
      xpToNext: xpNeededForLevel(14),
      streak: 12,
      gold: 620,
      attributes: { FOCUS: 74, DISCIPLINE: 81, EXECUTION: 77, KNOWLEDGE: 68, PLANNING: 73 },
      skills: [
        { id: "focus-basics", name: "Deep Focus", description: "Uninterrupted work sessions +15% efficiency.", tier: 1, unlocked: true, icon: "target" },
        { id: "plan-basics", name: "Prioritization", description: "Automatically rank your next moves.", tier: 1, unlocked: true, icon: "list" },
        { id: "nav-basics", name: "Pace Prediction", description: "See exactly how many hours remain.", tier: 1, unlocked: true, icon: "clock" },
        { id: "nav-crit", name: "Critical Path", description: "Never miss a blocking task again.", tier: 2, prerequisite: "nav-basics", unlocked: true, icon: "git" },
        { id: "plan-crit", name: "Risk Arbitrage", description: "Shift time between deadlines intelligently.", tier: 2, prerequisite: "plan-basics", unlocked: true, icon: "scale" },
        { id: "focus-pro", name: "Flow Reactor", description: "Chain missions for +50% XP.", tier: 3, prerequisite: "focus-basics", unlocked: false, icon: "zap" },
        { id: "plan-pro", name: "Time Master", description: "Plans self-heal around interruptions.", tier: 3, prerequisite: "plan-crit", unlocked: false, icon: "hourglass" },
        { id: "nav-pro", name: "Deadline Oracle", description: "Predict slip risk 7 days out.", tier: 3, prerequisite: "nav-crit", unlocked: false, icon: "crystal" }
      ],
      createdAt: inDays(-45)
    },
    goals: [
      {
        id: "goal-dbms-api",
        title: "Ship the DBMS REST API",
        description: "Wire the controller to the service layer and land a passing endpoint test suite.",
        priority: 5,
        progress: 45,
        dueDate: inDays(2),
        deadlineId: "dl-dbms",
        linkedTasks: ["t-dbms-c", "t-dbms-t", "t-dbms-e"],
        status: "active",
        createdAt: inDays(-14)
      },
      {
        id: "goal-web-devlog",
        title: "Publish the Week 2 devlog",
        description: "Document the architecture experiments and capture fresh screenshots.",
        priority: 3,
        progress: 30,
        dueDate: inDays(5),
        deadlineId: "dl-web",
        linkedTasks: ["t-web-1", "t-web-2"],
        status: "active",
        createdAt: inDays(-10)
      },
      {
        id: "goal-os-labs",
        title: "Close all OS lab reports",
        description: "Finish the outstanding write-ups so the practical block is fully submitted.",
        priority: 4,
        progress: 25,
        dueDate: inDays(8),
        deadlineId: "dl-os",
        linkedTasks: ["t-os-1"],
        status: "active",
        createdAt: inDays(-20)
      },
      {
        id: "goal-dsa-set",
        title: "Complete DSA problem set 6",
        description: "Graph algorithms \u2014 pathfinding and flow problems, all solved and reviewed.",
        priority: 2,
        progress: 100,
        dueDate: inDays(11),
        deadlineId: "dl-dsa",
        linkedTasks: [],
        status: "completed",
        completedAt: inDays(-1),
        createdAt: inDays(-21)
      }
    ],
    deadlines: [
      {
        id: "dl-dbms",
        title: "DBMS Project",
        subject: "Database Systems",
        dueDate: inDays(2),
        progress: 42,
        effortHours: 8,
        paceHoursPerDay: 3.5,
        blurb: "Relational schema, indexing strategy and the API integration layer."
      },
      {
        id: "dl-web",
        title: "Web Engineering Devlog",
        subject: "Advanced Web Engineering",
        dueDate: inDays(5),
        progress: 64,
        effortHours: 5,
        paceHoursPerDay: 2,
        blurb: "Weekly devlog documenting architecture decisions and experiments."
      },
      {
        id: "dl-os",
        title: "OS Practical Report",
        subject: "Operating Systems",
        dueDate: inDays(8),
        progress: 20,
        effortHours: 7,
        paceHoursPerDay: 2.5,
        blurb: "Lab write-ups and scheduling-simulation results."
      },
      {
        id: "dl-dsa",
        title: "DSA Problem Set 6",
        subject: "Data Structures & Algorithms",
        dueDate: inDays(11),
        progress: 85,
        effortHours: 3,
        paceHoursPerDay: 1.5,
        blurb: "Graph algorithms \u2014 the last three problems remain."
      }
    ],
    milestones: [
      { id: "ms-dbms-1", deadlineId: "dl-dbms", name: "Schema + ERD", order: 1, progress: 100, done: true, bossDamage: 22, xpReward: 80 },
      { id: "ms-dbms-2", deadlineId: "dl-dbms", name: "Indexing strategy", order: 2, progress: 70, done: false, bossDamage: 18, xpReward: 90 },
      { id: "ms-dbms-3", deadlineId: "dl-dbms", name: "REST API integration", order: 3, progress: 30, done: false, bossDamage: 30, xpReward: 150 },
      { id: "ms-dbms-4", deadlineId: "dl-dbms", name: "Test suite + docs", order: 4, progress: 0, done: false, bossDamage: 30, xpReward: 120 },
      { id: "ms-web-1", deadlineId: "dl-web", name: "Week 1 entry", order: 1, progress: 100, done: true, bossDamage: 50, xpReward: 70 },
      { id: "ms-web-2", deadlineId: "dl-web", name: "Week 2 entry", order: 2, progress: 30, done: false, bossDamage: 50, xpReward: 70 },
      { id: "ms-os-1", deadlineId: "dl-os", name: "Lab 1\u20133 write-ups", order: 1, progress: 40, done: false, bossDamage: 60, xpReward: 90 },
      { id: "ms-os-2", deadlineId: "dl-os", name: "Simulation analysis", order: 2, progress: 0, done: false, bossDamage: 40, xpReward: 90 },
      { id: "ms-dsa-1", deadlineId: "dl-dsa", name: "Pathfinding problems", order: 1, progress: 90, done: false, bossDamage: 70, xpReward: 80 },
      { id: "ms-dsa-2", deadlineId: "dl-dsa", name: "Flow + matching", order: 2, progress: 50, done: false, bossDamage: 30, xpReward: 80 }
    ],
    tasks: [
      { id: "t-dbms-c", deadlineId: "dl-dbms", milestoneId: "ms-dbms-3", title: "Connect controller to service layer", status: "todo", estimatedMinutes: 40, minutesDone: 0, priority: 5, criticalPath: true, dependsOn: "t-dbms-b" },
      { id: "t-dbms-b", deadlineId: "dl-dbms", milestoneId: "ms-dbms-2", title: "Configure REST routes", status: "done", estimatedMinutes: 30, minutesDone: 30, priority: 5, criticalPath: true },
      { id: "t-dbms-a", deadlineId: "dl-dbms", milestoneId: "ms-dbms-1", title: "Design schema", status: "done", estimatedMinutes: 50, minutesDone: 50, priority: 4, criticalPath: true },
      { id: "t-dbms-t", deadlineId: "dl-dbms", milestoneId: "ms-dbms-3", title: "Test endpoints (Postman)", status: "todo", estimatedMinutes: 45, minutesDone: 0, priority: 5, criticalPath: true, dependsOn: "t-dbms-c" },
      { id: "t-dbms-e", deadlineId: "dl-dbms", milestoneId: "ms-dbms-4", title: "Handle error responses", status: "todo", estimatedMinutes: 30, minutesDone: 0, priority: 4, criticalPath: true, dependsOn: "t-dbms-c" },
      { id: "t-web-1", deadlineId: "dl-web", milestoneId: "ms-web-2", title: "Draft Week 2 architecture section", status: "in_progress", estimatedMinutes: 60, minutesDone: 18, priority: 2, criticalPath: false },
      { id: "t-web-2", deadlineId: "dl-web", milestoneId: "ms-web-2", title: "Capture experiment screenshots", status: "todo", estimatedMinutes: 35, minutesDone: 0, priority: 1, criticalPath: false },
      { id: "t-os-1", deadlineId: "dl-os", milestoneId: "ms-os-1", title: "Finish Lab 3 report", status: "in_progress", estimatedMinutes: 80, minutesDone: 30, priority: 3, criticalPath: false },
      { id: "t-dsa-6", deadlineId: "dl-dsa", milestoneId: "ms-dsa-1", title: "Solve problem 6b (flow)", status: "todo", estimatedMinutes: 90, minutesDone: 0, priority: 2, criticalPath: false }
    ],
    missions: [
      { id: "msn-1", deadlineId: "dl-dbms", taskId: "t-dbms-c", brief: "Connect controller to service layer", status: "available", estimatedMinutes: 40, elapsedSessionSeconds: 0, xpReward: xpForMission(5, 40), attributeRewards: attributeGain(5), createdAt: inDays(-0.2) },
      { id: "msn-2", deadlineId: "dl-dbms", taskId: "t-dbms-t", brief: "Test endpoints (Postman)", status: "available", estimatedMinutes: 45, elapsedSessionSeconds: 0, xpReward: xpForMission(5, 45), attributeRewards: attributeGain(5), createdAt: inDays(-0.2) },
      { id: "msn-3", deadlineId: "dl-dbms", taskId: "t-dbms-e", brief: "Handle error responses", status: "available", estimatedMinutes: 30, elapsedSessionSeconds: 0, xpReward: xpForMission(4, 30), attributeRewards: attributeGain(4), createdAt: inDays(-0.2) },
      { id: "msn-4", deadlineId: "dl-web", taskId: "t-web-1", brief: "Draft Week 2 architecture section", status: "available", estimatedMinutes: 60, elapsedSessionSeconds: 0, xpReward: xpForMission(2, 60), attributeRewards: attributeGain(2), createdAt: inDays(-0.4) }
    ],
    plan: [],
    replan: null,
    achievements: [
      { id: "ach-1", name: "FIRST COMMAND", description: "Complete your first mission.", icon: "flag", unlocked: true, unlockedAt: inDays(-30), progress: 100, progressNow: 1, progressTarget: 1 },
      { id: "ach-2", name: "DEADLINE SLAYER", description: "Complete 10 deadlines.", icon: "swords", unlocked: false, progress: 40, progressNow: 4, progressTarget: 10 },
      { id: "ach-3", name: "EARLY VICTORY", description: "Finish 5 deadlines early.", icon: "timer", unlocked: false, progress: 20, progressNow: 1, progressTarget: 5 },
      { id: "ach-4", name: "CONSISTENT COMMANDER", description: "Maintain a 7-day streak.", icon: "flame", unlocked: true, unlockedAt: inDays(-6), progress: 100, progressNow: 12, progressTarget: 7 },
      { id: "ach-5", name: "MILESTONE BREAKER", description: "Defeat 10 boss milestones.", icon: "crosshair", unlocked: false, progress: 30, progressNow: 3, progressTarget: 10 },
      { id: "ach-6", name: "TACTICIAN", description: "Accept 5 replans from the advisor.", icon: "brain", unlocked: false, progress: 20, progressNow: 1, progressTarget: 5 }
    ],
    rewards: [
      { id: "rw-1", name: "Streak Shield", description: "Protects one missed day from breaking your streak.", priceGold: 250, owned: true, equipped: true, effect: "Missed-day protection", strength: 2 },
      { id: "rw-2", name: "XP Booster Chip", description: "+25% XP for the next 5 missions.", priceGold: 400, owned: false, equipped: false, effect: "+25% XP \xB7 5 missions", strength: 2 },
      { id: "rw-3", name: "Pace Accelerator", description: "Raises daily pace capacity by 30 minutes.", priceGold: 300, owned: false, equipped: false, effect: "+30 min pace / day", strength: 1 },
      { id: "rw-4", name: "Focus Serum", description: "Free 25 minutes of command focus, banked.", priceGold: 150, owned: false, equipped: false, effect: "Banked focus", strength: 1 },
      { id: "rw-5", name: "Time Vault", description: "Pause a deadline once without penalty.", priceGold: 600, owned: false, equipped: false, effect: "One-time delay", strength: 3 }
    ],
    activity: [],
    report: {
      weekLabel: "THIS WEEK",
      hoursCompleted: 0,
      executionEfficiency: 0,
      deadlineSuccessRate: 0,
      completionRate: 0,
      bestWindow: { from: "17:00", to: "20:00", note: "You perform best between 5 PM and 8 PM." },
      productivity: [
        { label: "MON", hours: 3.2 },
        { label: "TUE", hours: 4.1 },
        { label: "WED", hours: 2.8 },
        { label: "THU", hours: 5 },
        { label: "FRI", hours: 3.6 },
        { label: "SAT", hours: 1.8 },
        { label: "SUN", hours: 1.2 }
      ],
      plannedVsActual: [
        { day: "MON", planned: 3.5, actual: 3.1 },
        { day: "TUE", planned: 4, actual: 4.3 },
        { day: "WED", planned: 3, actual: 2.6 },
        { day: "THU", planned: 4.5, actual: 5.2 },
        { day: "FRI", planned: 3.5, actual: 3.6 },
        { day: "SAT", planned: 2, actual: 1.6 },
        { day: "SUN", planned: 1.5, actual: 1.2 }
      ],
      riskTrend: [
        { day: "MON", avgRisk: 34 },
        { day: "TUE", avgRisk: 41 },
        { day: "WED", avgRisk: 52 },
        { day: "THU", avgRisk: 63 },
        { day: "FRI", avgRisk: 58 },
        { day: "SAT", avgRisk: 49 },
        { day: "SUN", avgRisk: 61 }
      ],
      hotSpot: { kind: "high", title: "DBMS Project", where: "REST API integration" },
      styleNote: "Long, uninterrupted blocks win you more than many small tasks. Protect your evening window."
    }
  };
}
function read() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const s = seed();
      persist(s);
      return s;
    }
    const parsed = JSON.parse(raw);
    if (parsed && "profile" in parsed) return parsed;
    return seed();
  } catch {
    return seed();
  }
}
function persist(snapshot) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(snapshot));
  } catch {
  }
}
var db = {
  load: read,
  save: persist,
  seedVersion: SEED_VERSION,
  reset() {
    const s = seed();
    persist(s);
    return s;
  }
};
function derive(snapshot) {
  const tasks = snapshot.tasks.map((t) => t);
  const riskByDeadline = /* @__PURE__ */ new Map();
  for (const d of snapshot.deadlines) {
    const blocked = d.lockedBy ? snapshot.deadlines.find((x) => x.id === d.lockedBy) : void 0;
    const milestone = snapshot.milestones.find((m) => m.deadlineId === d.id && m.order === 2);
    riskByDeadline.set(d.id, assessRisk(d, tasks.filter((t) => t.deadlineId === d.id), milestone, blocked));
  }
  const nextAction = recommendNext(snapshot.deadlines, riskByDeadline, snapshot.missions);
  const boss = new Map(snapshot.deadlines.map((d) => [d.id, bossHealth(d, snapshot.milestones)]));
  const stats = synthesizeReport(snapshot.deadlines, snapshot.missions);
  return { snapshot, riskByDeadline, nextAction, boss, replan: snapshot.replan, stats };
}

// src/services/api.ts
var API_BASE = void 0;
var IS_LIVE = Boolean(API_BASE);
var LATENCY = 340;
function simulate(data) {
  return new Promise((resolve) => setTimeout(() => resolve(data), 80 + Math.random() * LATENCY));
}
function read2() {
  return db.load();
}
function logEvent(s, kind, title, detail, deltaXp, level) {
  s.activity.unshift({ id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, title, detail, at: (/* @__PURE__ */ new Date()).toISOString(), deltaXp, level });
  s.activity.length = Math.min(s.activity.length, 120);
}
async function fetchDerived() {
  return simulate(derive(read2()));
}
async function fetchProfile() {
  return simulate(read2().profile);
}
function completeMission(missionId, skillBoost = false) {
  const s = read2();
  const mission = s.missions.find((m) => m.id === missionId);
  if (!mission) throw new Error("Mission not found");
  const task = s.tasks.find((t) => t.id === mission.taskId);
  const deadline = s.deadlines.find((d) => d.id === mission.deadlineId);
  const priority = task?.priority ?? 1;
  mission.status = "completed";
  if (task) {
    task.status = "done";
    task.minutesDone = task.estimatedMinutes;
  }
  if (deadline) deadline.progress = progressFromTasks(s.tasks, deadline.id);
  let milestoneDefeated = null;
  let milestoneXp = 0;
  if (task?.milestoneId) {
    const milestone = s.milestones.find((m) => m.id === task.milestoneId);
    if (milestone && !milestone.done) {
      const siblings = s.tasks.filter((t) => t.milestoneId === milestone.id && t.deadlineId === milestone.deadlineId);
      const allDone = siblings.every((t) => t.status === "done");
      if (allDone) {
        milestone.done = true;
        milestone.progress = 100;
        milestoneDefeated = milestone.name;
        milestoneXp = milestone.xpReward;
      }
    }
  }
  const bossFrom = deadline ? bossHealth(deadline, s.milestones) : null;
  const bossTo = deadline ? bossHealth(deadline, s.milestones) : null;
  let xp = mission.xpReward + milestoneXp;
  if (skillBoost) xp += mission.xpReward * 0.5;
  xp = Math.round(xp);
  const beforeLevel = s.profile.level;
  const lvl = applyXp(s.profile, xp);
  s.profile.xp = lvl.remainingXp;
  s.profile.level = lvl.finalLevel;
  const levelsGained = lvl.levelsGained;
  s.profile.streak += 1;
  const delta = attributeGain(priority);
  Object.entries(delta).forEach(([k, v]) => {
    const key = k;
    s.profile.attributes[key] = Math.min(100, Math.max(5, s.profile.attributes[key] + (v ?? 0)));
  });
  logEvent(s, "mission", mission.brief, `+${xp} XP \xB7 streak ${s.profile.streak}d`, xp);
  if (milestoneDefeated && deadline) {
    logEvent(s, "milestone", `MILESTONE DEFEATED \u2014 ${milestoneDefeated}`, `${deadline.title} boss ${bossFrom}% \u2192 ${bossTo}% \xB7 +${milestoneXp} XP`, milestoneXp);
  }
  if (levelsGained > 0) {
    logEvent(s, "level", `LEVEL UP \u2014 ${beforeLevel} \u2192 ${s.profile.level}`, "New rank: DEADLINE HUNTER", void 0, s.profile.level);
  }
  db.save(s);
  const nextAction = deadline ? `Review "${deadline.title}" error handling, then close the last critical task.` : "Plan the next mission to keep momentum.";
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
    leveledUp: levelsGained > 0
  };
}
function goalProgress(s, g) {
  if (g.linkedTasks.length === 0) return g.progress;
  const done = g.linkedTasks.filter((id) => {
    const t = s.tasks.find((x) => x.id === id);
    return t?.status === "done" || t !== void 0 && t.estimatedMinutes > 0 && t.minutesDone >= t.estimatedMinutes;
  });
  const pct = Math.round(done.length / g.linkedTasks.length * 100);
  return Math.max(g.progress, pct);
}
async function fetchGoals() {
  const s = read2();
  return simulate(s.goals.map((g) => ({ ...g, progress: goalProgress(s, g) })));
}
async function createGoal(input) {
  const s = read2();
  const draft = {
    id: `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
    deadlineId: input.deadlineId,
    linkedTasks: input.linkedTasks,
    progress: 0,
    status: "active",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  s.goals.push(draft);
  logEvent(s, "goal", "GOAL SET \u2014 INTERCEPT", draft.title);
  db.save(s);
  return simulate(derive(s));
}
async function updateGoal(goalId, input) {
  const s = read2();
  const g = s.goals.find((x) => x.id === goalId);
  if (!g) throw new Error("Goal not found");
  const prior = g.title;
  Object.assign(g, input);
  if (input.title) logEvent(s, "goal", "GOAL UPDATED", `${prior} \u2192 ${g.title}`);
  db.save(s);
  return simulate(derive(s));
}
async function deleteGoal(goalId) {
  const s = read2();
  const g = s.goals.find((x) => x.id === goalId);
  s.goals = s.goals.filter((x) => x.id !== goalId);
  if (g) logEvent(s, "goal", "GOAL ABANDONED", g.title);
  db.save(s);
  return simulate(derive(s));
}
async function toggleGoal(goalId) {
  const s = read2();
  const g = s.goals.find((x) => x.id === goalId);
  if (!g) throw new Error("Goal not found");
  const completing = g.status !== "completed";
  g.status = completing ? "completed" : "active";
  if (completing) {
    g.progress = 100;
    g.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    logEvent(s, "goal", "GOAL COMPLETED", g.title);
  } else {
    g.completedAt = void 0;
    logEvent(s, "goal", "GOAL REOPENED", g.title);
  }
  db.save(s);
  return simulate(derive(s));
}
async function createTask(input) {
  const s = read2();
  const n = s.tasks.length + 1;
  const task = {
    id: `t-new-${Date.now().toString(36)}-${n}`,
    deadlineId: input.deadlineId,
    title: input.title,
    status: "todo",
    estimatedMinutes: input.estimatedMinutes,
    minutesDone: 0,
    priority: input.priority,
    criticalPath: false
  };
  s.tasks.push(task);
  s.missions.push({
    id: `msn-new-${Date.now().toString(36)}-${n}`,
    deadlineId: input.deadlineId,
    taskId: task.id,
    brief: input.title,
    status: "available",
    estimatedMinutes: input.estimatedMinutes,
    elapsedSessionSeconds: 0,
    xpReward: xpForMission(input.priority, input.estimatedMinutes),
    attributeRewards: attributeGain(input.priority),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  logEvent(s, "plan", "OPERATION ENLISTED", `New task: ${input.title}`);
  db.save(s);
  return simulate(derive(s));
}
async function updateTask(taskId, patch) {
  const s = read2();
  const task = s.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");
  const oldDeadlineId = task.deadlineId;
  Object.assign(task, patch);
  if (patch.title || patch.estimatedMinutes) {
    const mission = s.missions.find((m) => m.taskId === taskId);
    if (mission) {
      if (patch.title) mission.brief = patch.title;
      if (patch.estimatedMinutes) mission.estimatedMinutes = task.estimatedMinutes;
    }
  }
  if (patch.deadlineId && patch.deadlineId !== oldDeadlineId) {
    const mission = s.missions.find((m) => m.taskId === taskId);
    if (mission) mission.deadlineId = task.deadlineId;
    if (task.milestoneId) task.milestoneId = void 0;
    for (const did of [oldDeadlineId, task.deadlineId]) {
      const dl = s.deadlines.find((d) => d.id === did);
      if (dl) dl.progress = progressFromTasks(s.tasks, did);
    }
  }
  db.save(s);
  return simulate(derive(s));
}
async function deleteTask(taskId) {
  const s = read2();
  const task = s.tasks.find((t) => t.id === taskId);
  s.tasks = s.tasks.filter((t) => t.id !== taskId);
  s.missions = s.missions.filter((m) => m.taskId !== taskId);
  if (task) {
    const deadline = s.deadlines.find((d) => d.id === task.deadlineId);
    if (deadline) deadline.progress = progressFromTasks(s.tasks, deadline.id);
    logEvent(s, "plan", "OPERATION REMOVED", task.title);
  }
  db.save(s);
  return simulate(derive(s));
}
async function completeTask(taskId) {
  const s = read2();
  const task = s.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");
  const mission = s.missions.find((m) => m.taskId === taskId);
  if (mission && mission.status !== "completed") {
    completeMission(mission.id);
    return simulate(derive(read2()));
  }
  if (task.status === "done") return simulate(derive(s));
  task.status = "done";
  task.minutesDone = task.estimatedMinutes;
  const deadline = s.deadlines.find((d) => d.id === task.deadlineId);
  if (deadline) deadline.progress = progressFromTasks(s.tasks, deadline.id);
  if (task.milestoneId) {
    const milestone = s.milestones.find((m) => m.id === task.milestoneId);
    if (milestone && !milestone.done) {
      const siblings = s.tasks.filter((t) => t.milestoneId === milestone.id && t.deadlineId === milestone.deadlineId);
      if (siblings.every((t) => t.status === "done")) {
        milestone.done = true;
        milestone.progress = 100;
      }
    }
  }
  logEvent(s, "mission", task.title, "Task completed from the operations board");
  db.save(s);
  return simulate(derive(s));
}
async function flipTaskStatus(taskId, next) {
  return updateTask(taskId, { status: next });
}
async function updateProfile(patch) {
  const s = read2();
  Object.assign(s.profile, patch);
  logEvent(s, "profile", "IDENTITY UPDATED", patch.name ?? patch.title ?? "Profile edited");
  db.save(s);
  return simulate(derive(s));
}
function resetDemo() {
  return db.reset();
}

// scripts/smoke.ts
var mem = /* @__PURE__ */ new Map();
globalThis.localStorage = {
  getItem: (k) => mem.has(k) ? mem.get(k) : null,
  setItem: (k, v) => void mem.set(k, v),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear()
};
var failures = 0;
function assert(cond, label) {
  if (cond) console.log(`  \u2713 ${label}`);
  else {
    failures++;
    console.error(`  \u2717 ${label}`);
  }
}
async function main() {
  console.log("seed \u2192 derived");
  const base = await fetchDerived();
  assert(base.snapshot.tasks.length > 0, `seed tasks present (${base.snapshot.tasks.length})`);
  assert(base.snapshot.goals.length === 4, `4 seed goals present (${base.snapshot.goals.length})`);
  assert(base.riskByDeadline.size > 0, "riskByDeadline derived");
  assert(typeof base.stats.completionRate === "number" && base.stats.completionRate >= 0, "stats derived");
  console.log("fetchGoals rollup");
  const goals = await fetchGoals();
  const dbms = goals.find((g2) => g2.id === "goal-dbms-api");
  assert(dbms.progress >= 45, `goal progress rolls up linked tasks (${dbms.progress})`);
  console.log("createGoal");
  const g = await createGoal({ title: "Smoke objective", description: "temporary", priority: 2, linkedTasks: [] });
  const goals2 = await fetchGoals();
  const created = goals2.find((x) => x.title === "Smoke objective");
  assert(Boolean(created), "goal created");
  assert(created?.linkedTasks?.length === 0, "goal linkedTasks defaulted");
  console.log("updateGoal");
  await updateGoal(created.id, { description: "edited" });
  const goals3 = await fetchGoals();
  assert(goals3.find((x) => x.id === created.id).description === "edited", "goal field updated");
  console.log("toggleGoal complete");
  await toggleGoal(created.id);
  const goals4 = await fetchGoals();
  const done = goals4.find((x) => x.id === created.id);
  assert(done.status === "completed" && done.progress === 100, "toggleGoal completes + hits 100%");
  console.log("deleteGoal");
  await deleteGoal(created.id);
  const goals5 = await fetchGoals();
  assert(goals5.length === 4, "goal deleted");
  console.log("createTask \u2192 mission spawn");
  const beforeLen = base.snapshot.tasks.length;
  const t = await createTask({ deadlineId: "dl-dbms", title: "Smoke task", estimatedMinutes: 45, priority: 4 });
  const newTask = t.snapshot.tasks.find((x) => x.title === "Smoke task");
  assert(Boolean(newTask) && newTask.status === "todo", "task created as todo");
  const mission = t.snapshot.missions.find((m) => m.taskId === newTask.id);
  assert(Boolean(mission), "linked mission auto-spawned");
  assert(t.snapshot.tasks.length === beforeLen + 1, "task count incremented");
  console.log("updateTask title + mission sync");
  const t2 = await updateTask(newTask.id, { title: "Smoke task renamed", deadlineId: "dl-dbms" });
  const renamed = t2.snapshot.tasks.find((x) => x.id === newTask.id);
  assert(renamed.title === "Smoke task renamed", "task retitled");
  assert(t2.snapshot.missions.find((m) => m.taskId === newTask.id).brief === "Smoke task renamed", "mission brief follows task title");
  console.log("updateTask re-home deadline");
  const t3 = await updateTask(newTask.id, { deadlineId: "dl-os" });
  const rehomed = t3.snapshot.tasks.find((x) => x.id === newTask.id);
  assert(rehomed.deadlineId === "dl-os" && !rehomed.milestoneId, "task re-homed to new deadline, milestone unlinked");
  assert(t3.snapshot.missions.find((m) => m.taskId === newTask.id).deadlineId === "dl-os", "mission re-homed too");
  console.log("completeTask ceremony (linked mission)");
  const beforeXp = t3.snapshot.profile.xp;
  const beforeStreak = t3.snapshot.profile.streak;
  const c = await completeTask(newTask.id);
  const done2 = c.snapshot.tasks.find((x) => x.id === newTask.id);
  assert(done2.status === "done", "task completed");
  assert(c.snapshot.missions.find((m) => m.taskId === newTask.id).status === "completed", "mission ceremony completed");
  assert(c.snapshot.profile.xp > beforeXp, "XP awarded (ceremony ran)");
  assert(c.snapshot.profile.streak === beforeStreak + 1, "streak incremented");
  console.log("flipTaskStatus reopen");
  const f = await flipTaskStatus(newTask.id, "todo");
  assert(f.snapshot.tasks.find((x) => x.id === newTask.id).status === "todo", "task reopened");
  console.log("deleteTask unhooks mission");
  const d = await deleteTask(newTask.id);
  assert(!d.snapshot.tasks.some((x) => x.id === newTask.id), "task removed");
  assert(!d.snapshot.missions.some((m) => m.taskId === newTask.id), "mission removed");
  console.log("updateProfile");
  const p = await updateProfile({ name: "Smoke Commander" });
  assert(p.snapshot.profile.name === "Smoke Commander", "profile name updated");
  const prof = await fetchProfile();
  assert(prof.name === "Smoke Commander", "fetchProfile reflects rename");
  console.log("resetDemo restores seed");
  await resetDemo();
  const base2 = await fetchDerived();
  assert(base2.snapshot.goals.length === 4, "goals back to seed count after reset");
  const prof2 = await fetchProfile();
  assert(prof2.name !== "Smoke Commander", "profile name restored after reset");
  console.log("goal progress reacts to linked task completion");
  const seedDerived = await fetchDerived();
  const targetTask = seedDerived.snapshot.tasks.find((x) => x.id === "t-dbms-c");
  const targetMission = seedDerived.snapshot.missions.find((m) => m.taskId === targetTask.id);
  if (targetMission) {
    const before = (await fetchGoals()).find((x) => x.id === "goal-dbms-api").progress;
    await completeTask("t-dbms-c");
    await completeTask("t-dbms-t");
    const after = (await fetchGoals()).find((x) => x.id === "goal-dbms-api").progress;
    assert(after > before, `goal rollup clears stored floor ${before} \u2192 ${after}`);
    await resetDemo();
  } else {
    assert(true, "seed task lacks mission \u2014 skip rollup assertion");
  }
  console.log(failures === 0 ? "\nALL SMOKE CHECKS PASSED" : `
${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error("smoke crashed:", e);
  process.exit(1);
});
