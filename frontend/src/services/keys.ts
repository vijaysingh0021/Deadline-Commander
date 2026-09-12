/** TanStack Query keys — one source of truth for invalidation. */
export const keys = {
  derived: ['derived'] as const,
  profile: ['profile'] as const,
  plan: ['plan'] as const,
  activity: ['activity'] as const,
  goals: ['goals'] as const,
  settings: ['settings'] as const,
  deadline: (id: string) => ['deadline', id] as const,
}