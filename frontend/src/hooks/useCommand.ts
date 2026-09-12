import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchDerived,
  completeMission,
  acceptReplan,
  applyNextAction,
  setMissionStatus,
  proposeReplan,
  fetchGoals,
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
} from '@/services/api'
import { keys } from '@/services/keys'
import { useToast } from '@/stores/toast'
import type { CompleteMissionResult, GoalInput, TaskInput } from '@/services/api'
import type { Derived } from '@/services/db'
import type { Profile, ReplanProposal, Task } from '@/types'

/** The single source of truth for the whole command center. */
export function useCommand() {
  return useQuery({ queryKey: keys.derived, queryFn: fetchDerived })
}

/** Complete the running mission — fires toasts + celebration coordination. */
export function useCompleteMission(onDone: (r: CompleteMissionResult) => void) {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<CompleteMissionResult, Error, string>({
    mutationFn: async (missionId) => completeMission(missionId),
    onSuccess: (result) => {
      qc.setQueryData<Derived>(keys.derived, (old) => (old?.snapshot ? { ...old, snapshot: result.snapshot } : old))
      qc.invalidateQueries({ queryKey: keys.profile })
      qc.invalidateQueries({ queryKey: keys.activity })
      toast({ kind: 'mission', title: 'MISSION COMPLETED', detail: `+${result.xpGained} XP` })
      if (result.leveledUp) toast({ kind: 'level', title: `LEVEL ${result.newLevel} REACHED`, detail: 'Your commander rank has advanced.' })
      const unlocked = result.snapshot.activity.find((event) => event.kind === 'achievement')
      if (unlocked) toast({ kind: 'reward', title: unlocked.title, detail: unlocked.detail })
      onDone(result)
    },
  })
}

export function useAcceptReplan() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<Derived, Error, void>({
    mutationFn: () => acceptReplan(),
    onSuccess: (derived) => {
      qc.setQueryData(keys.derived, derived)
      toast({ kind: 'plan', title: 'PLAN UPDATED', detail: 'Your schedule was automatically adjusted.' })
    },
  })
}

export function useApplyNextAction() {
  const qc = useQueryClient()
  return useMutation<Derived, Error, { move: number; from: string; to: string }>({
    mutationFn: (args) => applyNextAction(args.move, args.from, args.to),
    onSuccess: (derived) => qc.setQueryData(keys.derived, derived),
  })
}

export function useSetMissionStatus() {
  const qc = useQueryClient()
  return useMutation<Derived, Error, { missionId: string; status: 'in_progress' | 'paused' | 'available' }>({
    mutationFn: (args) => setMissionStatus(args.missionId, args.status),
    onSuccess: (derived) => qc.setQueryData(keys.derived, derived),
  })
}

export function useProposeReplan() {
  const qc = useQueryClient()
  return useMutation<ReplanProposal, Error, string>({
    mutationFn: (missedTaskTitle) => proposeReplan(missedTaskTitle),
    onSuccess: (proposal) => {
      qc.setQueryData<Derived>(keys.derived, (old) => (old ? { ...old, replan: proposal } : old))
    },
  })
}

/* ── Goals ─────────────────────────────────────────────────── */

export function useGoals() {
  return useQuery({ queryKey: keys.goals, queryFn: fetchGoals })
}

/** Shared invalidation for any mutation that re-derives the command snapshot. */
function refreshAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.derived })
  qc.invalidateQueries({ queryKey: keys.goals })
  qc.invalidateQueries({ queryKey: keys.plan })
  qc.invalidateQueries({ queryKey: keys.profile })
  qc.invalidateQueries({ queryKey: keys.activity })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<Derived, Error, GoalInput>({
    mutationFn: (input) => createGoal(input),
    onSuccess: () => {
      refreshAll(qc)
      toast({ kind: 'info', title: 'GOAL SET', detail: 'A new objective has been locked in.' })
    },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation<Derived, Error, { goalId: string; input: Partial<GoalInput> }>({
    mutationFn: ({ goalId, input }) => updateGoal(goalId, input),
    onSuccess: () => refreshAll(qc),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<Derived, Error, string>({
    mutationFn: (goalId) => deleteGoal(goalId),
    onSuccess: () => {
      refreshAll(qc)
      toast({ kind: 'info', title: 'GOAL ABANDONED', detail: 'Objective removed from the board.' })
    },
  })
}

export function useToggleGoal() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<Derived, Error, string>({
    mutationFn: (goalId) => toggleGoal(goalId),
    onSuccess: () => {
      refreshAll(qc)
      toast({ kind: 'mission', title: 'GOAL STATUS CHANGED', detail: 'The board has been updated.' })
    },
  })
}

/* ── Tasks / operations board ──────────────────────────────── */

export function useCreateTask() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<Derived, Error, TaskInput>({
    mutationFn: (input) => createTask(input),
    onSuccess: () => {
      refreshAll(qc)
      toast({ kind: 'plan', title: 'OPERATION ENLISTED', detail: 'A new task is ready to launch.' })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation<Derived, Error, { taskId: string; patch: Partial<Pick<Task, 'title' | 'estimatedMinutes' | 'priority' | 'status' | 'deadlineId'>> }>({
    mutationFn: ({ taskId, patch }) => updateTask(taskId, patch),
    onSuccess: () => refreshAll(qc),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<Derived, Error, string>({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: () => {
      refreshAll(qc)
      toast({ kind: 'info', title: 'OPERATION REMOVED', detail: 'Task struck from the board.' })
    },
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<Derived, Error, string>({
    mutationFn: (taskId) => completeTask(taskId),
    onSuccess: () => {
      refreshAll(qc)
      toast({ kind: 'mission', title: 'TASK COMPLETED', detail: 'Objective secured.' })
    },
  })
}

export function useFlipTaskStatus() {
  const qc = useQueryClient()
  return useMutation<Derived, Error, { taskId: string; next: 'todo' | 'in_progress' }>({
    mutationFn: ({ taskId, next }) => flipTaskStatus(taskId, next),
    onSuccess: () => refreshAll(qc),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const toast = useToast((s) => s.push)
  return useMutation<Derived, Error, Partial<Pick<Profile, 'name' | 'title'>>>({
    mutationFn: (patch) => updateProfile(patch),
    onSuccess: () => {
      refreshAll(qc)
      toast({ kind: 'info', title: 'IDENTITY UPDATED', detail: 'Profile refreshed across the command center.' })
    },
  })
}
