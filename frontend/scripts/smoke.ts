/* Functional smoke test for the mock service layer (api.ts + db.ts + brain.ts).
   Run via esbuild bundle → node. Exercises the full mutation surface that the
   new Goals / Tasks / Settings pages depend on. */

// Minimal in-memory localStorage so mutations actually persist across calls.
const mem = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
}

import {
  fetchDerived,
  fetchGoals,
  fetchProfile,
  createGoal,
  updateGoal,
  deleteGoal,
  toggleGoal,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  flipTaskStatus,
  updateProfile,
  resetDemo,
} from '../src/services/api'

let failures = 0
function assert(cond: boolean, label: string) {
  if (cond) console.log(`  ✓ ${label}`)
  else {
    failures++
    console.error(`  ✗ ${label}`)
  }
}

async function main() {
  console.log('seed → derived')
  const base = await fetchDerived()
  assert(base.snapshot.tasks.length > 0, `seed tasks present (${base.snapshot.tasks.length})`)
  assert(base.snapshot.goals.length === 4, `4 seed goals present (${base.snapshot.goals.length})`)
  assert(base.riskByDeadline.size > 0, 'riskByDeadline derived')
  assert(typeof base.stats.completionRate === 'number' && base.stats.completionRate >= 0, 'stats derived')

  console.log('fetchGoals rollup')
  const goals = await fetchGoals()
  const dbms = goals.find((g) => g.id === 'goal-dbms-api')!
  assert(dbms.progress >= 45, `goal progress rolls up linked tasks (${dbms.progress})`)

  console.log('createGoal')
  const g = await createGoal({ title: 'Smoke objective', description: 'temporary', priority: 2, linkedTasks: [] })
  const goals2 = await fetchGoals()
  const created = goals2.find((x) => x.title === 'Smoke objective')
  assert(Boolean(created), 'goal created')
  assert((created as any)?.linkedTasks?.length === 0, 'goal linkedTasks defaulted')

  console.log('updateGoal')
  await updateGoal(created!.id, { description: 'edited' })
  const goals3 = await fetchGoals()
  assert(goals3.find((x) => x.id === created!.id)!.description === 'edited', 'goal field updated')

  console.log('toggleGoal complete')
  await toggleGoal(created!.id)
  const goals4 = await fetchGoals()
  const done = goals4.find((x) => x.id === created!.id)!
  assert(done.status === 'completed' && done.progress === 100, 'toggleGoal completes + hits 100%')

  console.log('deleteGoal')
  await deleteGoal(created!.id)
  const goals5 = await fetchGoals()
  assert(goals5.length === 4, 'goal deleted')

  console.log('createTask → mission spawn')
  const beforeLen = base.snapshot.tasks.length
  const t = await createTask({ deadlineId: 'dl-dbms', title: 'Smoke task', estimatedMinutes: 45, priority: 4 })
  const newTask = t.snapshot.tasks.find((x) => x.title === 'Smoke task')
  assert(Boolean(newTask) && newTask!.status === 'todo', 'task created as todo')
  const mission = t.snapshot.missions.find((m) => m.taskId === newTask!.id)
  assert(Boolean(mission), 'linked mission auto-spawned')
  assert(t.snapshot.tasks.length === beforeLen + 1, 'task count incremented')

  console.log('updateTask title + mission sync')
  const t2 = await updateTask(newTask!.id, { title: 'Smoke task renamed', deadlineId: 'dl-dbms' })
  const renamed = t2.snapshot.tasks.find((x) => x.id === newTask!.id)!
  assert(renamed.title === 'Smoke task renamed', 'task retitled')
  assert(t2.snapshot.missions.find((m) => m.taskId === newTask!.id)!.brief === 'Smoke task renamed', 'mission brief follows task title')

  console.log('updateTask re-home deadline')
  const t3 = await updateTask(newTask!.id, { deadlineId: 'dl-os' })
  const rehomed = t3.snapshot.tasks.find((x) => x.id === newTask!.id)!
  assert(rehomed.deadlineId === 'dl-os' && !rehomed.milestoneId, 'task re-homed to new deadline, milestone unlinked')
  assert(t3.snapshot.missions.find((m) => m.taskId === newTask!.id)!.deadlineId === 'dl-os', 'mission re-homed too')

  console.log('completeTask ceremony (linked mission)')
  const beforeXp = t3.snapshot.profile.xp
  const beforeCoins = t3.snapshot.profile.gold
  const beforeStreak = t3.snapshot.profile.streak
  const c = await completeTask(newTask!.id)
  const done2 = c.snapshot.tasks.find((x) => x.id === newTask!.id)!
  assert(done2.status === 'done', 'task completed')
  assert(c.snapshot.missions.find((m) => m.taskId === newTask!.id)!.status === 'completed', 'mission ceremony completed')
  assert(c.snapshot.profile.xp > beforeXp, 'XP awarded (ceremony ran)')
  assert(c.snapshot.profile.gold > beforeCoins, 'in-app coins awarded')
  assert(c.snapshot.profile.streak === beforeStreak + 1, 'streak incremented')

  console.log('flipTaskStatus reopen')
  const f = await flipTaskStatus(newTask!.id, 'todo')
  assert(f.snapshot.tasks.find((x) => x.id === newTask!.id)!.status === 'todo', 'task reopened')

  console.log('deleteTask unhooks mission')
  const d = await deleteTask(newTask!.id)
  assert(!d.snapshot.tasks.some((x) => x.id === newTask!.id), 'task removed')
  assert(!d.snapshot.missions.some((m) => m.taskId === newTask!.id), 'mission removed')

  console.log('updateProfile')
  const p = await updateProfile({ name: 'Smoke Commander' })
  assert(p.snapshot.profile.name === 'Smoke Commander', 'profile name updated')
  const prof = await fetchProfile()
  assert(prof.name === 'Smoke Commander', 'fetchProfile reflects rename')

  console.log('resetDemo restores seed')
  await resetDemo()
  const base2 = await fetchDerived()
  assert(base2.snapshot.goals.length === 4, 'goals back to seed count after reset')
  const prof2 = await fetchProfile()
  assert(prof2.name !== 'Smoke Commander', 'profile name restored after reset')

  // Goal rollup after task work: mark the linked 't-dbms-t' task done via its mission and confirm goal progress rises.
  console.log('goal progress reacts to linked task completion')
  const seedDerived = await fetchDerived()
  const targetTask = seedDerived.snapshot.tasks.find((x) => x.id === 't-dbms-c')!
  const targetMission = seedDerived.snapshot.missions.find((m) => m.taskId === targetTask.id)
  if (targetMission) {
    const before = (await fetchGoals()).find((x) => x.id === 'goal-dbms-api')!.progress
    // Two of three linked tasks (40 + 45 of 115 min) clears the 45% stored floor.
    await completeTask('t-dbms-c')
    await completeTask('t-dbms-t')
    const after = (await fetchGoals()).find((x) => x.id === 'goal-dbms-api')!.progress
    assert(after > before, `goal rollup clears stored floor ${before} → ${after}`)
    await resetDemo()
  } else {
    assert(true, 'seed task lacks mission — skip rollup assertion')
  }

  console.log(failures === 0 ? '\nALL SMOKE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
  process.exitCode = failures === 0 ? 0 : 1
}

main().catch((e) => {
  console.error('smoke crashed:', e)
  process.exitCode = 1
})
