import { useState } from 'react'
import { mockNotifications } from '@/lib/mock-data'
import { timeAgo } from '@/lib/utils'
import { Bell, CheckCheck, Trash2, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

const typeConfig = {
  success:{icon:CheckCircle2,color:"text-emerald-400",bg:"bg-emerald-500/10",border:"border-emerald-500/20"},
  error:{icon:XCircle,color:"text-red-400",bg:"bg-red-500/10",border:"border-red-500/20"},
  warning:{icon:AlertTriangle,color:"text-yellow-400",bg:"bg-yellow-500/10",border:"border-yellow-500/20"},
  info:{icon:Info,color:"text-blue-400",bg:"bg-blue-500/10",border:"border-blue-500/20"},
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const unread = notifications.filter(n=>!n.read).length

  const markRead = (id: string) => setNotifications(prev=>prev.map(n=>n.id===id?{...n,read:true}:n))
  const markAllRead = () => setNotifications(prev=>prev.map(n=>({...n,read:true})))
  const clearAll = () => setNotifications([])

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-slate-400 mt-0.5">{unread} unread</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={markAllRead}><CheckCheck className="w-4 h-4"/>Mark all read</button>
          <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm" onClick={clearAll}><Trash2 className="w-4 h-4"/>Clear all</button>
        </div>
      </div>

      {notifications.length===0 && (
        <div className="text-center py-16 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20"/>
          <p>No notifications</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map(n=>{
          const cfg = typeConfig[n.type]
          const Icon = cfg.icon
          return (
            <div key={n.id} onClick={()=>markRead(n.id)}
              className={cn("flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                n.read ? "bg-[#14161e] border-[#1e2130] opacity-60 hover:opacity-80" : `${cfg.bg} ${cfg.border} hover:opacity-90`)}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",cfg.bg)}>
                <Icon className={cn("w-4 h-4",cfg.color)}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{n.title}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-purple-500 ml-auto flex-shrink-0"/>}
                </div>
                <p className="text-sm text-slate-400">{n.message}</p>
                <span className="text-xs text-slate-500 mt-1 block">{timeAgo(n.timestamp)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}