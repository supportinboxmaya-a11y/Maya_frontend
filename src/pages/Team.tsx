import { Users, Plus, Crown, Shield, User, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const members = [
  {id:1,name:"Admin User",email:"admin@maya.ai",role:"admin",status:"online",tasks:45},
  {id:2,name:"Sarah Chen",email:"sarah@maya.ai",role:"manager",status:"online",tasks:32},
  {id:3,name:"Dev Bot",email:"dev@maya.ai",role:"user",status:"offline",tasks:18},
  {id:4,name:"Research AI",email:"research@maya.ai",role:"user",status:"online",tasks:27},
]

const sharedTasks = [
  {goal:"Weekly AI research report",assignee:"Sarah Chen",status:"done",updated:"2 hours ago"},
  {goal:"Code review automation setup",assignee:"Dev Bot",status:"running",updated:"30 mins ago"},
  {goal:"Market analysis Q1 2025",assignee:"Research AI",status:"pending",updated:"1 day ago"},
]

const roleConfig = {
  admin:{icon:Crown,badge:"badge-yellow",label:"Admin"},
  manager:{icon:Shield,badge:"badge-purple",label:"Manager"},
  user:{icon:User,badge:"badge-blue",label:"User"},
} as const

export function Team() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Workspace</h1>
          <p className="text-sm text-slate-400 mt-0.5">{members.length} members · {members.filter(m=>m.status==="online").length} online</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4"/>Invite Member</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-white">Members</h2>
          {members.map(m=>{
            const role = roleConfig[m.role as keyof typeof roleConfig]
            const RoleIcon = role.icon
            return (
              <div key={m.id} className="card-hover p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-sm font-bold text-purple-400 flex-shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{m.name}</span>
                      <span className={cn("w-2 h-2 rounded-full",m.status==="online"?"bg-emerald-400 animate-pulse":"bg-slate-500")}/>
                    </div>
                    <div className="text-xs text-slate-500">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{m.tasks}</div>
                      <div className="text-xs text-slate-500">tasks</div>
                    </div>
                    <span className={cn("badge",role.badge)}><RoleIcon className="w-3 h-3"/>{role.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Shared Tasks</h2>
          {sharedTasks.map((t,i)=>(
            <div key={i} className="card-hover p-4">
              <div className="flex items-start gap-2 mb-2">
                <Activity className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0"/>
                <p className="text-xs text-white">{t.goal}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{t.assignee}</span>
                <span className={cn("badge",t.status==="done"?"badge-green":t.status==="running"?"badge-blue":"badge-yellow")}>{t.status}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{t.updated}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}