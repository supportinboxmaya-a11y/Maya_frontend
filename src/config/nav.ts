import { Home, MessageSquare, ListTodo, Activity, User, Brain, Database, Users, Sparkles, Workflow, Puzzle, FileText, Volume2, Eye, BarChart3, Zap, Shield, HardDrive, Boxes } from "lucide-react"
import type { LucideIcon } from "lucide-react"
export interface Dest { id: string; label: string; icon: LucideIcon; path: string }
export const PRIMARY_NAV: Dest[] = [
  { id:"home",     label:"Home",     icon:Home,          path:"/" },
  { id:"tasks",    label:"Tasks",    icon:ListTodo,      path:"/tasks" },
  { id:"chat",     label:"Ask",      icon:MessageSquare, path:"/chat" },
  { id:"activity", label:"Activity", icon:Activity,      path:"/activity" },
  { id:"profile",  label:"Profile",  icon:User,          path:"/profile" },
]
export const ADVANCED: { g: string; items: Dest[] }[] = [
  { g:"Intelligence", items:[{ id:"memory",label:"Memory",icon:Brain,path:"/memory" },{ id:"knowledge",label:"Knowledge",icon:Database,path:"/knowledge" },{ id:"agents",label:"Agents",icon:Users,path:"/agents" },{ id:"learning",label:"Learning",icon:Sparkles,path:"/learning" }] },
  { g:"Build", items:[{ id:"workflow",label:"Workflows",icon:Workflow,path:"/workflow" },{ id:"plugins",label:"Plugins",icon:Puzzle,path:"/plugins" },{ id:"prompts",label:"Prompts",icon:FileText,path:"/prompts" }] },
  { g:"Studio", items:[{ id:"voice",label:"Voice",icon:Volume2,path:"/voice" },{ id:"vision",label:"Vision",icon:Eye,path:"/vision" }] },
  { g:"Insights", items:[{ id:"analytics",label:"Analytics",icon:BarChart3,path:"/analytics" },{ id:"cost",label:"Cost",icon:Zap,path:"/cost" }] },
  { g:"Enterprise", items:[{ id:"team",label:"Team",icon:Users,path:"/team" },{ id:"security",label:"Security",icon:Shield,path:"/security" },{ id:"backup",label:"Backup",icon:HardDrive,path:"/backup" },{ id:"integrations",label:"Integrations",icon:Boxes,path:"/integrations" },{ id:"admin",label:"Admin",icon:Shield,path:"/admin" }] },
]
export const ADMIN_ONLY = new Set<string>(["tools", ...ADVANCED.flatMap((s) => s.items.map((i) => i.id))])
export const ALL_DEST: (Dest & { group: string })[] = [...PRIMARY_NAV.map((n) => ({ ...n, group: "Main" })), ...ADVANCED.flatMap((s) => s.items.map((i) => ({ ...i, group: s.g })))]
