import { create } from 'zustand'
import type { Task, Notification } from '@/types'

interface AgentStore {
  status: string; currentGoal: string | null
  setStatus: (s: string) => void; setCurrentGoal: (g: string | null) => void
}
export const useAgentStore = create<AgentStore>((set) => ({
  status: 'idle', currentGoal: null,
  setStatus: (status) => set({ status }),
  setCurrentGoal: (currentGoal) => set({ currentGoal }),
}))

interface TaskStore {
  tasks: Task[]; activeTaskId: string | null
  addTask: (t: Task) => void
  setActiveTask: (id: string | null) => void
}
export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [], activeTaskId: null,
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  setActiveTask: (activeTaskId) => set({ activeTaskId }),
}))

interface NotificationStore {
  notifications: Notification[]; unreadCount: number
  addNotification: (n: Notification) => void
  markAllRead: () => void
}
export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [], unreadCount: 0,
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications], unreadCount: s.unreadCount + 1 })),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map(n => ({...n, read: true})), unreadCount: 0 })),
}))

interface UIStore {
  sidebarCollapsed: boolean; toggleSidebar: () => void
}
export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))