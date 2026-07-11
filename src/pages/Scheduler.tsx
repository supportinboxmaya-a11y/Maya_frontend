import { useEffect, useState } from 'react'
import { schedulerAPI } from '@/lib/api'
import { Clock, Plus, Trash2, Loader2, X, Power } from 'lucide-react'
import toast from 'react-hot-toast'

interface Schedule {
  id: string; name: string; cron: string; job: string; args: unknown[]
  kwargs: Record<string, unknown>; enabled: boolean
  created_at: number; last_run: number | null; next_run: number | null
}

const CRON_PRESETS = [
  { label: 'Every hour', value: '@hourly' },
  { label: 'Every day at midnight', value: '@daily' },
  { label: 'Every Monday 9am', value: '0 9 * * 1' },
  { label: 'Custom...', value: '' },
]

function fmt(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

export function Scheduler() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [cron, setCron] = useState('@daily')
  const [customCron, setCustomCron] = useState('')
  const [goal, setGoal] = useState('')

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const res: any = await schedulerAPI.list()
      setSchedules(res?.schedules || [])
    } catch { toast.error('Failed to load schedules') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSchedules() }, [])

  const create = async () => {
    const finalCron = cron || customCron
    if (!name.trim() || !finalCron.trim() || !goal.trim()) {
      return toast.error('Name, cron, and goal are all required')
    }
    setSaving(true)
    try {
      // Only "agent_goal" is registered as a queue job handler by default —
      // it runs the given goal through Maya's chat pipeline on each firing.
      await schedulerAPI.create({ name: name.trim(), cron: finalCron.trim(), job: 'agent_goal', args: [goal.trim()] })
      toast.success('Schedule created')
      setShowForm(false); setName(''); setGoal(''); setCron('@daily'); setCustomCron('')
      fetchSchedules()
    } catch (e: any) { toast.error(e?.detail || 'Failed to create schedule — check the cron expression') }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this schedule?')) return
    try {
      await schedulerAPI.delete(id)
      setSchedules(prev => prev.filter(s => s.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  const toggle = async (s: Schedule) => {
    try {
      await schedulerAPI.setEnabled(s.id, !s.enabled)
      setSchedules(prev => prev.map(x => x.id === s.id ? { ...x, enabled: !x.enabled } : x))
    } catch { toast.error('Toggle failed') }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-purple-400"/>Scheduler</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>New Schedule</button>
      </div>
      <p className="text-xs text-slate-500">Recurring goals run automatically through Maya on a cron schedule — persisted, so they survive a server restart.</p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : schedules.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[15px] text-slate-400">No schedules yet.</p>
          <p className="text-sm text-slate-500 mt-1">Create one to have Maya run a goal automatically on a recurring basis.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-white">{s.name}</span>
                    <span className={`badge text-[10px] ${s.enabled ? 'badge-green' : 'badge-red'}`}>{s.enabled ? 'enabled' : 'disabled'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{s.cron}</span>
                  </div>
                  {s.args?.[0] && <p className="text-xs text-slate-400 mt-1 truncate">Goal: {String(s.args[0])}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggle(s)} className={`text-slate-500 ${s.enabled ? 'hover:text-yellow-400' : 'hover:text-emerald-400'}`} title={s.enabled ? 'Disable' : 'Enable'}>
                    <Power className="w-4 h-4"/>
                  </button>
                  <button onClick={() => remove(s.id)} className="text-slate-500 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="flex gap-4 text-[11px] text-slate-500">
                <span>Last run: {fmt(s.last_run)}</span>
                <span>Next run: {fmt(s.next_run)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Schedule</h3>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Schedule name" className="input w-full"/>
            <div>
              <label className="text-xs text-slate-400">When</label>
              <select value={cron} onChange={e => setCron(e.target.value)} className="input w-full mt-1">
                {CRON_PRESETS.map(p => <option key={p.label} value={p.value}>{p.label}</option>)}
              </select>
              {cron === '' && (
                <input value={customCron} onChange={e => setCustomCron(e.target.value)}
                  placeholder="5-field cron, e.g. 0 9 * * 1-5" className="input w-full mt-2 font-mono text-xs"/>
              )}
            </div>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3}
              placeholder="Goal Maya should run each time this fires..." className="input w-full resize-none"/>
            <div className="flex gap-2">
              <button onClick={create} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : null}Create
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
