import { create } from 'zustand'

export type FocusModeState =
  | { phase: 'idle' }
  | { phase: 'running'; missionId: string }
  | { phase: 'paused'; missionId: string }
  | { phase: 'completing'; missionId: string }
  | { phase: 'done' }

const SIDEBAR_KEY = 'dc.sidebarCollapsed'

interface UiState {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  focus: FocusModeState
  setFocus: (f: FocusModeState) => void
  isFocusOpen: () => boolean
}

export const useUi = create<UiState>((set, get) => ({
  sidebarCollapsed: (() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })(),
  setSidebarCollapsed: (v) => {
    try {
      localStorage.setItem(SIDEBAR_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
    set({ sidebarCollapsed: v })
  },
  focus: { phase: 'idle' },
  setFocus: (focus) => set({ focus }),
  isFocusOpen: () => get().focus.phase !== 'idle',
}))