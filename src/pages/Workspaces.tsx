import { useEffect, useState } from 'react'
import { workspaceAPI } from '@/lib/api'
import { Layers, Plus, Trash2, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Ws { scope: string; kind: string; label: string; team_id?: string | null }
interface WsMemory { id: string; scope: string; content: string; author: string; memory_type: string; created_at: number }

export function Workspaces() {
  const [workspaces, setWorkspaces] = useState<Ws[]>([])
  const [active, setActive] = useState<string>('default')
  const [memories, setMemories] = useState<WsMemory[]>([])
  const [stats, setStats] = useState<{ total: number; by_type: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')

  const fetchWorkspaces = async () => {
    try {
      const res: any = await workspaceAPI.list()
      const ws: Ws[] = res?.workspaces || []
      setWorkspaces(ws)
      if (ws.length && !ws.find(w => w.scope === active)) setActive(ws[0].scope)
    } catch { toast.error('Failed to load workspaces') }
  }

  const fetchMemories = async () => {
    setLoading(true)
    try {
      const [memRes, statRes]: any = await Promise.all([
        workspaceAPI.search(active, query, 50),
        workspaceAPI.stats(active),
      ])
      setMemories(memRes?.results || [])
      setStats({ total: statRes?.total || 0, by_type: statRes?.by_type || {} })
    } catch { setMemories([]); setStats(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWorkspaces() }, [])
  useEffect(() => { if (active) fetchMemories() }, [active])

  const addMemory = async () => {
    if (!newContent.trim()) return
    try {
      await workspaceAPI.add(active, newContent.trim())
      setNewContent(''); setAdding(false)
      toast.success('Added')
      fetchMemories()
    } catch (e: any) { toast.error(e?.detail || 'Failed to add') }
  }

  const removeMemory = async (id: string) => {
    try {
      await workspaceAPI.remove(active, id)
      setMemories(prev => prev.filter(m => m.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-bold text-white flex items-center gap-2"><Layers className="w-5 h-5 text-purple-400"/>Workspaces</h1>
      <p className="text-xs text-slate-500">Personal and team memory, isolated per workspace — nothing here crosses into another workspace's context.</p>

      {workspaces.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {workspaces.map(w => (
            <button key={w.scope} onClick={() => setActive(w.scope)}
              className={`px-3 py-1.5 rounded-lg text-xs ${active === w.scope ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-[#14161e] text-slate-400 border border-[#262b3f]'}`}>
              {w.label} <span className="opacity-60">({w.kind})</span>
            </button>
          ))}
        </div>
      )}

      {stats && (
        <div className="card p-3 flex flex-wrap gap-4 text-xs text-slate-400">
          <span><span className="text-white font-medium">{stats.total}</span> total</span>
          {Object.entries(stats.by_type).map(([type, count]) => (
            <span key={type}><span className="text-white font-medium">{count}</span> {type}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchMemories()}
          placeholder="Search this workspace..." className="input flex-1"/>
        <button onClick={fetchMemories} className="btn-secondary px-3"><Search className="w-4 h-4"/></button>
        <button onClick={() => setAdding(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add</button>
      </div>

      {adding && (
        <div className="card p-4 space-y-3">
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
            placeholder="Content to remember in this workspace..." rows={3}
            className="input w-full resize-none"/>
          <div className="flex gap-2">
            <button onClick={addMemory} className="btn-primary">Save</button>
            <button onClick={() => setAdding(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : memories.length === 0 ? (
        <div className="text-center text-slate-500 py-16">No memories in this workspace yet</div>
      ) : (
        <div className="space-y-2">
          {memories.map(m => (
            <div key={m.id} className="card p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">{m.content}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge badge-purple text-[10px]">{m.memory_type}</span>
                  {m.author && <span className="text-[10px] text-slate-500">by {m.author}</span>}
                  <span className="text-[10px] text-slate-600">{new Date(m.created_at * 1000).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => removeMemory(m.id)} className="text-slate-600 hover:text-red-400 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
