import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react'

export function Skills() {
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = async () => {
    setLoading(true); setError('')
    try { setSkills(((await api.get('/skills')) as any)?.skills || []) }
    catch (e: any) { setError(e?.detail || 'Could not load skills - agent core may be starting.') }
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  return (
    <div className="p-5 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-purple-400"/>Skills Manager</h1>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div> :
        error ? <div className="card p-6 text-center text-sm text-yellow-300">{error}</div> :
        skills.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-[15px] text-slate-400">No skill plugins loaded.</p>
            <p className="text-sm text-slate-500 mt-1">Drop plugin files into the backend plugins folder - they load on startup.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skills.map((s: any, i) => (
              <div key={i} className="card p-4">
                <div className="text-[15px] font-semibold text-white">{s.name || `Skill ${i + 1}`}</div>
                {s.description && <p className="text-sm text-slate-400 mt-1">{s.description}</p>}
              </div>))}
          </div>
        )}
    </div>
  )
}
