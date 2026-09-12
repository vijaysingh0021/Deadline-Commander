import { create } from 'zustand'
import type { Toast } from '@/types'

const MAX_TOASTS = 4

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({ toasts: [...s.toasts.slice(-(MAX_TOASTS - 1)), { ...t, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))