import { useEffect, useMemo, useState } from 'react'
import { memoryAPI, memoryPlusAPI, learningAPI } from '@/lib/api'
import { Loader2, Trash2, Plus, Search, Sparkles, Archive } from 'lucide-react'
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

  const fetchMemories = async () => {
    setLoading(true)
    try {
      const data = await memoryAPI.list({ limit: 50 })
      setMemories((data as any) || [])
    } catch { setMemories([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMemories() }, [])

  // The backend has no /memory/analytics endpoint, so this is computed
  // client-side from the memories already on screen (most recent 50) —
  // real data, just scoped to what's loaded rather than the full store.
  const analytics = useMemo(() => {
    if (memories.length === 0) return null
    const byType: Record<string, number> = {}
    let importanceSum = 0
    let importanceCount = 0
    for (const m of memories) {
      byType[m.type] = (byType[m.type] || 0) + 1
      const imp = importanceOf(m)
      if (imp !== null) { importanceSum += imp; importanceCount++ }
    }
    return {
      by_type: byType,
      importance_avg: importanceCount > 0 ? importanceSum / importanceCount : null,
    }
  }, [memories])

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
      fetchMemories()
    } catch { toast.error('Failed to add memory') }
  }

  const handleDelete = async (id: string) => {
    try {
      const res: any = await memoryAPI.delete(id)
      if (res?.deleted === false) { toast.error('Memory was not found on the server'); return }
      setMemories(prev => prev.filter(m => m.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  // Uses the real cleanup endpoint (POST /memory/cleanup, Phase 2), which
  // returns {total, expired, overflow, deleted, dry_run}.
  const handleCleanup = async () => {
    setBusy('cleanup')
    try {
      const preview: any = await memoryPlusAPI.cleanup(true)
      if (!preview.expired && !preview.overflow) { toast.success('Nothing to clean up'); return }
      if (!window.confirm(`This will permanently delete ${preview.expired + preview.overflow} old/low-value memories (of ${preview.total}). Continue?`)) return
      const result: any = await memoryPlusAPI.cleanup(false)
      toast.success(`Deleted ${result.deleted} memories`)
      fetchMemories()
    } catch { toast.error('Cleanup failed') }
    finally { setBusy(null) }
  }

  // Uses the real compression endpoint (POST /learning/compress, Phase 10),
  // which returns {type, compressed, kept, digest_created, ...}. It keeps
  // the most recent 20 memories of a type and digests the rest.
  const handleCompress = async () => {
    setBusy('compress')
    try {
      const preview: any = await learningAPI.compress('general', true)
      if (!preview.compressed) { toast.success('Nothing old enough to compress yet'); return }
      if (!window.confirm(`This will summarize ${preview.compressed} older memories into one entry and delete the originals. Continue?`)) return
      const result: any = await learningAPI.compress('general', false)
      toast.success(`Compressed ${result.compressed} memories into one summary`)
      fetchMemories()
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
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{m.content}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="badge badge-purple text-[10px]">{m.type}</span>
                      {importance !== null && (
                        <span className="text-[10px] text-slate-500" title="Importance score">★ {(importance * 100).toFixed(0)}%</span>
                      )}
                      <span className="text-[10px] text-slate-600">{new Date(m.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleDelete(m.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
