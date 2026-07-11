import { create } from "zustand"
import type { Notification, Task, CostSummary } from "@/types"

export const useAgentStore = create<{status:string;currentGoal:string|null;setStatus:(s:string)=>void;setCurrentGoal:(g:string|null)=>void}>((set)=>({status:"idle",currentGoal:null,setStatus:(status)=>set({status}),setCurrentGoal:(currentGoal)=>set({currentGoal})}))

export const useNotificationStore = create<{notifications:Notification[];unreadCount:number;addNotification:(n:Notification)=>void;markAllRead:()=>void;clearAll:()=>void;setUnreadCount:(n:number)=>void}>((set)=>({
  notifications:[],
  unreadCount:0,
  addNotification:(n)=>set(s=>({notifications:[n,...s.notifications].slice(0,100),unreadCount:s.unreadCount+1})),
  markAllRead:()=>set(s=>({notifications:s.notifications.map(n=>({...n,read:true})),unreadCount:0})),
  clearAll:()=>set({notifications:[],unreadCount:0}),
  setUnreadCount:(unreadCount)=>set({unreadCount}),
}))

export const useUIStore = create<{sidebarCollapsed:boolean;commandPaletteOpen:boolean;toggleSidebar:()=>void;setCommandPalette:(open:boolean)=>void}>((set)=>({sidebarCollapsed:false,commandPaletteOpen:false,toggleSidebar:()=>set(s=>({sidebarCollapsed:!s.sidebarCollapsed})),setCommandPalette:(commandPaletteOpen)=>set({commandPaletteOpen})}))

export const useTaskStore = create<{tasks:Task[];activeTaskId:string|null;setTasks:(t:Task[])=>void;setActiveTask:(id:string|null)=>void;addTask:(t:Task)=>void;updateTask:(id:string,u:Partial<Task>)=>void}>((set)=>({tasks:[],activeTaskId:null,setTasks:(tasks)=>set({tasks}),setActiveTask:(activeTaskId)=>set({activeTaskId}),addTask:(task)=>set(s=>({tasks:[task,...s.tasks]})),updateTask:(id,updates)=>set(s=>({tasks:s.tasks.map(t=>t.id===id?{...t,...updates}:t)}))}))

const EMPTY_COST: CostSummary = { session_start: new Date().toISOString(), total_calls: 0, total_input_tokens: 0, total_output_tokens: 0, total_tokens: 0, total_cost_usd: 0, budget_usd: 1, budget_used_pct: 0, by_provider: {} }

export const useCostStore = create<{costSummary:CostSummary;setCostSummary:(c:CostSummary)=>void;resetSession:()=>void}>((set)=>({costSummary:EMPTY_COST,setCostSummary:(costSummary)=>set({costSummary}),resetSession:()=>set({costSummary:EMPTY_COST})}))
