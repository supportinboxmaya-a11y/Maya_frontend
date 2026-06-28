import { NavLink } from 'react-router-dom'
import { LayoutDashboard,MessageSquare,Brain,Wrench,BarChart3,Settings,Shield,GitBranch,Puzzle,Mic,Eye,Terminal,Bell,Users,DollarSign,Activity,TestTube,ArchiveRestore,Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const sections = [
  {label:"Core",items:[
    {to:"/",icon:LayoutDashboard,label:"Dashboard"},
    {to:"/chat",icon:MessageSquare,label:"Chat / Tasks"},
    {to:"/memory",icon:Brain,label:"Memory Center"},
    {to:"/tools",icon:Wrench,label:"Tool Manager"},
    {to:"/analytics",icon:BarChart3,label:"Analytics"},
    {to:"/cost",icon:DollarSign,label:"Cost & Budget"},
  ]},
  {label:"Build",items:[
    {to:"/workflow",icon:GitBranch,label:"Workflow Builder"},
    {to:"/plugins",icon:Puzzle,label:"Plugin Marketplace"},
  ]},
  {label:"AI Studio",items:[
    {to:"/voice",icon:Mic,label:"Voice Studio"},
    {to:"/vision",icon:Eye,label:"Vision Studio"},
  ]},
  {label:"Backend",items:[
    {to:"/backend/overview",icon:Activity,label:"Backend Overview"},
    {to:"/backend/logs",icon:Terminal,label:"Logs"},
  ]},
  {label:"Enterprise",items:[
    {to:"/team",icon:Users,label:"Team Workspace"},
    {to:"/security",icon:Shield,label:"Security Center"},
    {to:"/testing",icon:TestTube,label:"Testing Console"},
    {to:"/backup",icon:ArchiveRestore,label:"Backup & Restore"},
    {to:"/integrations",icon:Globe,label:"Integrations"},
  ]},
  {label:"System",items:[
    {to:"/notifications",icon:Bell,label:"Notifications"},
    {to:"/settings",icon:Settings,label:"Settings"},
  ]},
]

export function Sidebar() {
  return <aside className="fixed top-0 left-0 h-screen w-60 bg-[#0f1117] border-r border-[#1e2130] flex flex-col z-50">
    <div className="flex items-center gap-2 p-4 border-b border-[#1e2130]">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">M</div>
      <div><div className="text-sm font-bold text-white">Maya</div><div className="text-xs text-slate-500 font-mono">2.0 ULTRA</div></div>
    </div>
    <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
      {sections.map(s=>(
        <div key={s.label}>
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">{s.label}</div>
          <div className="space-y-0.5">
            {s.items.map(item=>(
              <NavLink key={item.to} to={item.to} end={item.to==="/"}>
                {({isActive})=>(
                  <div className={cn(isActive?"sidebar-item-active":"sidebar-item")}>
                    <item.icon className="w-4 h-4 flex-shrink-0"/><span className="truncate">{item.label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
    <div className="p-3 border-t border-[#1e2130]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">A</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white">Admin</div>
          <div className="text-xs text-slate-500">admin@maya.ai</div>
        </div>
      </div>
    </div>
  </aside>
}