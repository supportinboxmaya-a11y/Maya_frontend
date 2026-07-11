import { useEffect, useState } from 'react'
import { useNotificationStore } from '@/store'
import { notificationAPI } from '@/lib/api'
import { Bell, Check, Trash2, Loader2 } from 'lucide-react'
import type { Notification } from '@/types'

const typeColor: Record<Notification["type"], string> = {
  success: "badge-green", error: "badge-red", warning: "badge-yellow", info: "badge-blue"
}

// Maps a backend notification event name to the local display type.
function eventToType(event: string): Notification["type"] {
  if (event.endsWith('.done') || event === 'task.done') return 'success'
  if (event.endsWith('.failed') || event === 'task.failed') return 'error'
  return 'info'
}

export function Notifications() {
  // Live, in-session entries pushed over the WebSocket (task started/done —
  // see components/layout/Layout.tsx). These aren't persisted server-side,
  // so they only cover "what just happened while this tab was open."
  const { notifications: liveNotifications, markAllRead: markAllReadLocal, clearAll } = useNotificationStore()

  // Real history from the backend (Superpower 8), which survives refresh.
  const [serverNotifications, setServerNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res: any = await notificationAPI.list(false, 50)
      const mapped: Notification[] = (res?.notifications || []).map((n: any) => ({
        id: n.id,
        type: eventToType(n.event || ''),
        title: n.title,
        message: n.body || '',
        timestamp: new Date((n.created_at || 0) * 1000).toISOString(),
        read: !!n.read,
      }))
      setServerNotifications(mapped)
    } catch {
      setServerNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [])

  const handleMarkAllRead = async () => {
    setMarking(true)
    try {
      await notificationAPI.markAllRead()
      setServerNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* best-effort */ }
    markAllReadLocal()
    setMarking(false)
  }

  const handleMarkRead = async (id: string) => {
    setServerNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try { await notificationAPI.markRead(id) } catch { /* best-effort */ }
  }

  // There's no backend delete/clear endpoint for notification history, so
  // this only dismisses the live in-session entries from view — persisted
  // history will reappear on the next fetch.
  const handleClear = () => clearAll()

  const all = [...liveNotifications, ...serverNotifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Notifications</h1>
        <div className="flex gap-2">
          <button onClick={handleMarkAllRead} disabled={marking} className="btn-secondary text-xs py-1.5">
            {marking ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>}Mark all read
          </button>
          <button onClick={handleClear} className="btn-secondary text-xs py-1.5"><Trash2 className="w-3 h-3"/>Clear live</button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : all.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell className="w-10 h-10 text-slate-700"/>
          <div className="text-slate-500">No notifications</div>
        </div>
      ) : (
        <div className="space-y-2">
          {all.map(n => (
            <button key={n.id} onClick={() => !n.read && handleMarkRead(n.id)}
              className={`card p-4 flex gap-3 transition-all w-full text-left ${!n.read ? 'border-purple-500/20' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-purple-400' : 'bg-slate-700'}`}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{n.title}</span>
                  <span className={`badge ${typeColor[n.type]} text-[10px]`}>{n.type}</span>
                </div>
                <div className="text-xs text-slate-400">{n.message}</div>
                <div className="text-[10px] text-slate-600 mt-1">{new Date(n.timestamp).toLocaleString()}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
