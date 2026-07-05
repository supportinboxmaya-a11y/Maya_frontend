import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { UserCheck, RefreshCw, Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const modes = [
  { id: 'auto', label: 'Auto', desc: 'Only high-risk actions wait for you' },
  { id: 'human', label: 'Human', desc: 'Every action waits for approval' },
  { id: 'skip', label: 'Skip', desc: 'Nothing waits - full autonomy' },
]

export function Approvals() {
  const [mode, setMode] = useState('auto')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    const [m, a] = await Promise.allSettled([api.get('/approval/mode'), api.get('/approvals')])
    if (m.status === 'fulfilled') setMode((m.value as any)?.mode || 'auto')
    if (a.status === 'fulfilled') setItems((a.value as any)?.approvals || [])
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const changeMode = async (next: string) => {
    try { await api.put('/approval/mode', { mode: next }); setMode(next); toast.success(`Mode: ${next}`) }
    catch { toast.error('Failed to change mode') }
  }
  const decide = async (id: string, d: 'approve' | 'reject') => {
    try {
      await api.post(`/approvals/${id}/${d}`)
      setItems(p => p.map(a => a.id === id ? { ...a, status: d === 'approve' ? 'approved' : 'rejected' } : a))
      toast.success(d === 'approve' ? 'Approved' : 'Rejected')
    } catch { toast.error('Decision failed') }
  }

  const pending = items.filter(a => a.status === 'pending')
  return (
    <div className="p-5 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2"><UserCheck className="w-6 h-6 text-purple-400"/>Human Approval</h1>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
      </div>
      <section>
        <div className="section-title">Approval Mode</div>
        <div className="space-y-2">
          {modes.map(m => (
            <button key={m.id} onClick={() => changeMode(m.id)}
              className={cn('w-full card p-4 text-left flex items-center justify-between', mode === m.id && 'border-purple-500/50 bg-purple-500/10')}>
              <div><div className="text-[15px] font-semibold text-white">{m.label}</div><div className="text-sm text-slate-400">{m.desc}</div></div>
              {mode === m.id && <Check className="w-5 h-5 text-purple-400"/>}
            </button>))}
        </div>
      </section>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div> : (
        <section>
          <div className="section-title">Waiting for You ({pending.length})</div>
          {pending.length === 0 ? <div className="card p-6 text-center text-sm text-slate-500">Nothing is waiting. Requests appear when Maya needs permission.</div> :
            pending.map(a => (
              <div key={a.id} className="card p-4 space-y-3 mb-3">
                <div className="text-[15px] text-white">{a.action}</div>
                <div className="flex gap-2">
                  <button onClick={() => decide(a.id, 'approve')} className="btn-primary flex-1"><Check className="w-4 h-4"/>Approve</button>
                  <button onClick={() => decide(a.id, 'reject')} className="btn-secondary flex-1"><X className="w-4 h-4"/>Reject</button>
                </div>
              </div>))}
        </section>
      )}
    </div>
  )
}
