import { useEffect, useState } from 'react'
import { memoryAPI } from '@/lib/api'
import { Loader2, Trash2, Plus, Search, Sparkles, Archive, Pencil, History, X, Check } from 'lucide-react'
import type { Memory } from '@/types'
import toast from 'react-hot-toast'

function importanceOf(m: Memory): number | null {
  const v = m.metadata?.importance
  return typeof v === 'number' ? v : null
}

export function Memory() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [busy, setBusy] = useState<'cleanup' | 'compress' | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [historyVersions, setHistoryVersions] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchMemories = async () => {
    setLoading(true)
    try {
      const data = await memoryAPI.list({ limit: 50 })
      setMemories((data as any) || [])
    } catch { setMemories([]) }
    finally { setLoading(false) }
  }

  const fetchAnalytics = async () => {
    try { setAnalytics(await memoryAPI.analytics()) } catch { setAnalytics(null) }
  }

  useEffect(() => { fetchMemories(); fetchAnalytics() }, [])

  const handleSearch = async () => {
    if (!query.trim()) return fetchMemories()
    setLoading(true)
    try {
      const data = await memoryAPI.search(query)
      setMemories((data as any) || [])
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  const handleAdd = async () => {
    if (!newContent.trim()) return
    try {
      await memoryAPI.add(newContent)
      setNewContent(''); setAdding(false)
      toast.success('Memory added')
      fetchMemories(); fetchAnalytics()
    } catch { toast.error('Failed to add memory') }
  }

  const handleDelete = async (id: string) => {
    try {
      const res: any = await memoryAPI.delete(id)
      if (res?.deleted === false) { toast.error('Memory was not found on the server'); return }
      setMemories(prev => prev.filter(m => m.id !== id))
      toast.success('Deleted')
      fetchAnalytics()
    } catch { toast.error('Delete failed') }
  }

  const startEdit = (m: Memory) => { setEditingId(m.id); setEditDraft(m.content) }

  const saveEdit = async (id: string) => {
    if (!editDraft.trim()) return
    try {
      const updated: any = await memoryAPI.update(id, editDraft)
      setMemories(prev => prev.map(m => m.id === id ? { ...m, content: updated.content, metadata: updated.metadata } : m))
      setEditingId(null)
      toast.success('Memory updated (previous version kept in history)')
    } catch { toast.error('Update failed') }
  }

  const openHistory = async (id: string) => {
    setHistoryId(id); setHistoryLoading(true)
    try {
      const res: any = await memoryAPI.getVersions(id)
      setHistoryVersions(res?.versions || [])
    } catch { toast.error('Could not load history') }
    finally { setHistoryLoading(false) }
  }

  const handleCleanup = async () => {
    setBusy('cleanup')
    try {
      const preview: any = await memoryAPI.cleanup(true)
      if (!preview.expired && !preview.overflow) { toast.success('Nothing to clean up'); return }
      if (!window.confirm(`This will permanently delete ${preview.expired + preview.overflow} old/low-value memories (of ${preview.total}). Continue?`)) return
      const result: any = await memoryAPI.cleanup(false)
      toast.success(`Deleted ${result.deleted} memories`)
      fetchMemories(); fetchAnalytics()
    } catch { toast.error('Cleanup failed') }
    finally { setBusy(null) }
  }

  const handleCompress = async () => {
    setBusy('compress')
    try {
      const preview: any = await memoryAPI.compress('general', 20, true)
      if (!preview.compressed) { toast.success('Nothing old enough to compress yet'); return }
      if (!window.confirm(`This will summarize ${preview.compressed} older memories into one entry and delete the originals. Continue?`)) return
      const result: any = await memoryAPI.compress('general', 20, false)
      toast.success(`Compressed ${result.compressed} memories into one summary`)
      fetchMemories(); fetchAnalytics()
    } catch { toast.error('Compression failed') }
    finally { setBusy(null) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-white">Memory Center</h1>
        <div className="flex gap-2">
          <button onClick={handleCompress} disabled={busy !== null} className="btn-secondary text-xs gap-1">
            {busy === 'compress' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Archive className="w-3.5 h-3.5"/>}
            Compress
          </button>
          <button onClick={handleCleanup} disabled={busy !== null} className="btn-secondary text-xs gap-1">
            {busy === 'cleanup' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>}
            Cleanup
          </button>
          <button onClick={() => setAdding(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add</button>
        </div>
      </div>

      {analytics && (
        <div className="card p-4 flex flex-wrap gap-4 text-xs text-slate-400">
          {Object.entries(analytics.by_type || {}).map(([type, count]) => (
            <span key={type}><span className="text-white font-medium">{count as number}</span> {type}</span>
          ))}
          {analytics.importance_avg !== null && (
            <span className="ml-auto">avg importance: <span className="text-white font-medium">{Math.round(analytics.importance_avg * 100)}%</span></span>
          )}
        </div>
      )}

      {adding && (
        <div className="card p-4 space-y-3">
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
            placeholder="Memory content..." rows={3}
            className="input w-full resize-none"/>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary">Save</button>
            <button onClick={() => setAdding(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search memories..." className="input flex-1"/>
        <button onClick={handleSearch} className="btn-secondary px-3"><Search className="w-4 h-4"/></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : memories.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No memories found</div>
      ) : (
        <div className="space-y-2">
          {memories.map(m => {
            const importance = importanceOf(m)
            const isEditing = editingId === m.id
            return (
              <div key={m.id} className="card p-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea value={editDraft} onChange={e => setEditDraft(e.target.value)}
                      rows={3} className="input w-full resize-none"/>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(m.id)} className="btn-primary text-xs gap-1"><Check className="w-3.5 h-3.5"/>Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary text-xs gap-1"><X className="w-3.5 h-3.5"/>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">{m.content}</div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="badge badge-purple text-[10px]">{m.type}</span>
                        {importance !== null && (
                          <span className="text-[10px] text-slate-500" title="Importance score">★ {(importance * 100).toFixed(0)}%</span>
                        )}
                        <span className="text-[10px] text-slate-600">{new Date(m.timestamp).toLocaleDateString()}</span>
                        {(m.version || 1) > 1 && (
                          <button onClick={() => openHistory(m.id)} className="text-[10px] text-blue-400 flex items-center gap-0.5">
                            <History className="w-3 h-3"/>v{(m as any).version}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(m)} className="text-slate-600 hover:text-blue-400 transition-colors"><Pencil className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(m.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {historyId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setHistoryId(null)}>
          <div className="card p-4 max-w-md w-full max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Version History</h3>
              <button onClick={() => setHistoryId(null)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            {historyLoading ? <Loader2 className="w-5 h-5 animate-spin text-purple-400 mx-auto"/> : (
              <div className="space-y-2">
                {historyVersions.map((v, i) => (
                  <div key={i} className="p-2 rounded-lg bg-[#14161e] border border-[#262b3f]">
                    <div className="text-xs text-slate-500 mb-1">
                      v{v.version} {v.superseded_at ? `— replaced ${new Date(v.superseded_at).toLocaleString()}` : '(current)'}
                    </div>
                    <div className="text-sm text-slate-300">{v.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
