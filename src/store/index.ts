import { create } from "zustand"
import type { Notification, Task, CostSummary } from "@/types"
import { mockNotifications, mockTasks, mockCostSummary } from "@/lib/mock-data"

export const useAgentStore = create<{status:string;currentGoal:string|null;setStatus:(s:string)=>void;setCurrentGoal:(g:string|null)=>void}>((set)=>({status:"idle",currentGoal:null,setStatus:(status)=>set({status}),setCurrentGoal:(currentGoal)=>set({currentGoal})}))

export const useNotificationStore = create<{notifications:Notification[];unreadCount:number;markAllRead:()=>void;clearAll:()=>void}>((set)=>({notifications:mockNotifications,unreadCount:mockNotifications.filter(n=>!n.read).length,markAllRead:()=>set(s=>({notifications:s.notifications.map(n=>({...n,read:true})),unreadCount:0})),clearAll:()=>set({notifications:[],unreadCount:0})}))

export const useUIStore = create<{sidebarCollapsed:boolean;commandPaletteOpen:boolean;toggleSidebar:()=>void;setCommandPalette:(open:boolean)=>void}>((set)=>({sidebarCollapsed:false,commandPaletteOpen:false,toggleSidebar:()=>set(s=>({sidebarCollapsed:!s.sidebarCollapsed})),setCommandPalette:(commandPaletteOpen)=>set({commandPaletteOpen})}))

export const useTaskStore = create<{tasks:Task[];activeTaskId:string|null;setTasks:(t:Task[])=>void;setActiveTask:(id:string|null)=>void;addTask:(t:Task)=>void;updateTask:(id:string,u:Partial<Task>)=>void}>((set)=>({tasks:mockTasks,activeTaskId:null,setTasks:(tasks)=>set({tasks}),setActiveTask:(activeTaskId)=>set({activeTaskId}),addTask:(task)=>set(s=>({tasks:[task,...s.tasks]})),updateTask:(id,updates)=>set(s=>({tasks:s.tasks.map(t=>t.id===id?{...t,...updates}:t)}))}))

export const useCostStore = create<{costSummary:CostSummary;setCostSummary:(c:CostSummary)=>void;resetSession:()=>void}>((set)=>({costSummary:mockCostSummary,setCostSummary:(costSummary)=>set({costSummary}),resetSession:()=>set({costSummary:mockCostSummary})}))