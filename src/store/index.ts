import { create } from "zustand"
import type { Notification } from "@/types"
import { mockNotifications } from "@/lib/mock-data"

export const useAgentStore = create<{
  status:string; currentGoal:string|null
  setStatus:(s:string)=>void; setCurrentGoal:(g:string|null)=>void
}>((set)=>({
  status:"idle",currentGoal:null,
  setStatus:(status)=>set({status}),
  setCurrentGoal:(currentGoal)=>set({currentGoal}),
}))

export const useNotificationStore = create<{
  notifications:Notification[]; unreadCount:number
  markAllRead:()=>void; clearAll:()=>void
}>((set)=>({
  notifications:mockNotifications,
  unreadCount:mockNotifications.filter(n=>!n.read).length,
  markAllRead:()=>set(s=>({notifications:s.notifications.map(n=>({...n,read:true})),unreadCount:0})),
  clearAll:()=>set({notifications:[],unreadCount:0}),
}))

export const useUIStore = create<{
  sidebarCollapsed:boolean; toggleSidebar:()=>void
}>((set)=>({
  sidebarCollapsed:false,
  toggleSidebar:()=>set(s=>({sidebarCollapsed:!s.sidebarCollapsed})),
}))