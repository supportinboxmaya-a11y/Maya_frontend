import { create } from 'zustand'

export const useAgentStore = create<{
  status: string; currentGoal: string | null
  setStatus: (s: string) => void; setCurrentGoal: (g: string | null) => void
}>((set) => ({
  status: 'idle', currentGoal: null,
  setStatus: (status) => set({ status }),
  setCurrentGoal: (currentGoal) => set({ currentGoal }),
}))

export const useUIStore = create<{
  sidebarCollapsed: boolean; toggleSidebar: () => void
}>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))