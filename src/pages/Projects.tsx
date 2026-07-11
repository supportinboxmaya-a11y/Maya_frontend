import { useEffect, useState } from 'react'
import { projectAPI } from '@/lib/api'
import { Target, Plus, Trash2, Loader2, X, History } from 'lucide-react'
import toast from 'react-hot-toast'

interface Project {
  id: string; project_id: string; goal: string; name: string; enabled: boolean
  cron: string; last_run: number | null; next_run: number | null
  latest_progress: { content: string; created_at?: number } | null
}

function fmt(ts: number | null | undefined) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [cron, setCron] = useState('@hourly')
  const [saving, setSaving] = useState(false)
  const [historyFor, setHistoryFor] = useState<Project | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res: any = await projectAPI.list()
      setProjects(res?.projects || [])
    } catch { toast.error('Failed to load projects') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProjects() }, [])

  const create = async () => {
    if (!name.trim() || !goal.trim()) return toast.error('Name and goal are required')
    setSaving(true)
    try {
      await projectAPI.create(name.trim(), goal.trim(), cron)
      toast.success('Project started')
      setShowForm(false); setName(''); setGoal(''); setCron('@hourly')
      fetchProjects()
    } catch (e: any) { toast.error(e?.detail || 'Failed to start project') }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Stop this project? Its progress history is kept, but it will stop working toward the goal.')) return
    try {
      await projectAPI.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Stopped')
    } catch { toast.error('Failed to stop') }
  }

  const openHistory = async (p: Project) => {
    setHistoryFor(p); setHistoryLoading(true)
    try {
      const res: any = await projectAPI.progress(p.id)
      setHistory(res?.history || [])
    } catch { toast.error('Could not load history') }
    finally { setHistoryLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-purple-400"/>Projects</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>New Project</button>
      </div>
      <p className="text-xs text-slate-500">
        Standing goals: unlike a one-shot task, a project keeps working toward its goal on a schedule,
        remembering its own progress between runs — and stops itself once it decides the goal is done.
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : projects.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[15px] text-slate-400">No projects yet.</p>
          <p className="text-sm text-slate-500 mt-1">Start one for a goal too big for a single task run.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(p => (
            <div key={p.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-white">{p.name}</span>
                    <span className={`badge text-[10px] ${p.enabled ? 'badge-green' : 'badge-default'}`}>{p.enabled ? 'active' : 'complete/stopped'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{p.cron}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{p.goal}</p>
                  {p.latest_progress && (
                    <p className="text-xs text-slate-500 mt-2 border-l-2 border-purple-500/30 pl-2">Latest: {p.latest_progress.content}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openHistory(p)} className="text-slate-500 hover:text-blue-400" title="Progress history"><History className="w-4 h-4"/></button>
                  <button onClick={() => remove(p.id)} className="text-slate-500 hover:text-red-400" title="Stop project"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="flex gap-4 text-[11px] text-slate-500">
                <span>Last run: {fmt(p.last_run)}</span>
                <span>Next run: {fmt(p.next_run)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Project</h3>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" className="input w-full"/>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3}
              placeholder="The standing goal, e.g. 'Keep researching competitor pricing and update a running summary'" className="input w-full resize-none"/>
            <div>
              <label className="text-xs text-slate-400">How often it checks in</label>
              <select value={cron} onChange={e => setCron(e.target.value)} className="input w-full mt-1">
                <option value="@hourly">Every hour</option>
                <option value="@daily">Every day</option>
                <option value="0 9 * * 1">Every Monday 9am</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={create} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : null}Start
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setHistoryFor(null)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white truncate">{historyFor.name} — progress</h3>
              <button onClick={() => setHistoryFor(null)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            {historyLoading ? <Loader2 className="w-5 h-5 animate-spin text-purple-400 mx-auto"/> : (
              history.length === 0 ? <p className="text-xs text-slate-500">No progress recorded yet.</p> :
              history.map((h, i) => (
                <div key={i} className="p-2 rounded-lg bg-[#0f1117] border border-[#1e2130] text-xs text-slate-300">{h.content}</div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
