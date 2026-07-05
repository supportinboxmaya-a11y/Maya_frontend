import { useEffect, useState } from 'react'
import { api, llmAPI } from '@/lib/api'
import { Cpu, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export function LLMProviders() {
  const [providers, setProviders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    const [p, s] = await Promise.allSettled([api.get('/llm/providers'), llmAPI.stats()])
    if (p.status === 'fulfilled') setProviders((p.value as any)?.providers || [])
    if (s.status === 'fulfilled') setStats((s.value as any)?.stats || s.value)
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const toggle = async (p: any) => {
    const id = p.id || p.name
    try {
      await api.post(`/llm/providers/${id}/toggle`, { enabled: !p.enabled })
      setProviders(prev => prev.map(x => (x.id || x.name) === id ? { ...x, enabled: !p.enabled } : x))
      toast.success(`${p.label} ${!p.enabled ? 'enabled' : 'disabled'}`)
    } catch { toast.error('Toggle failed') }
  }

  return (
    <div className="p-5 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2"><Cpu className="w-6 h-6 text-purple-400"/>LLM Providers</h1>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div> : (
        <>
          <section className="space-y-3">
            {providers.length === 0 && <div className="card p-6 text-center text-sm text-slate-500">Provider list unavailable - refresh in a moment.</div>}
            {providers.map(p => (
              <div key={p.id || p.name} className="card p-4 flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full', p.active ? 'bg-emerald-400' : p.configured ? 'bg-yellow-400' : 'bg-slate-600')}/>
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-white">{p.label}</div>
                  <div className="text-sm text-slate-400">{p.configured ? 'Key set' : 'No key'}</div>
                </div>
                <button onClick={() => toggle(p)} disabled={!p.configured}
                  className={cn('w-14 h-8 rounded-full relative transition-colors', p.enabled && p.configured ? 'bg-purple-600' : 'bg-[#262b3f]', !p.configured && 'opacity-40')}>
                  <span className={cn('absolute top-1 w-6 h-6 rounded-full bg-white transition-all', p.enabled && p.configured ? 'left-7' : 'left-1')}/>
                </button>
              </div>))}
          </section>
          <section>
            <div className="section-title">Usage</div>
            {!stats || Object.keys(stats).length === 0 ? <div className="card p-6 text-center text-sm text-slate-500">No calls yet.</div> :
              <div className="card p-4"><pre className="text-sm text-slate-300 overflow-x-auto">{JSON.stringify(stats, null, 2)}</pre></div>}
          </section>
        </>
      )}
    </div>
  )
}
