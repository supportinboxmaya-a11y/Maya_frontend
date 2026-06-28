import { useNotificationStore } from '@/store'
import { Bell, Check, Trash2 } from 'lucide-react'
import type { Notification } from '@/types'

const typeColor: Record<Notification["type"], string> = {
  success: "badge-green", error: "badge-red", warning: "badge-yellow", info: "badge-blue"
}

export function Notifications() {
  const { notifications, markAllRead, clearAll } = useNotificationStore()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="btn-secondary text-xs py-1.5"><Check className="w-3 h-3"/>Mark all read</button>
          <button onClick={clearAll} className="btn-secondary text-xs py-1.5"><Trash2 className="w-3 h-3"/>Clear all</button>
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell className="w-10 h-10 text-slate-700"/>
          <div className="text-slate-500">No notifications</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`card p-4 flex gap-3 transition-all ${!n.read ? 'border-purple-500/20' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-purple-400' : 'bg-slate-700'}`}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{n.title}</span>
                  <span className={`badge ${typeColor[n.type]} text-[10px]`}>{n.type}</span>
                </div>
                <div className="text-xs text-slate-400">{n.message}</div>
                <div className="text-[10px] text-slate-600 mt-1">{new Date(n.timestamp).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
