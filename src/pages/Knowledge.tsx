import { useEffect, useState } from 'react'
import { ragAPI } from '@/lib/api'
import { Loader2, Trash2, Plus, Search, Database, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface RagDoc {
  id: string; title: string; doc_type: string; source: string
  chunk_count: number; char_count: number; version: number; updated_at: string
}
interface RagHit {
  ref: number; title: string; source: string; doc_type: string
  section: string; score: number; engine: string; content: string; doc_id: string
}
interface RagStats {
  documents: number; chunks: number; total_chars: number
  by_type: Record<string, number>; fts5: boolean; vector_engine: string
}

export function Knowledge() {
  const [docs, setDocs] = useState<RagDoc[]>([])
  const [stats, setStats] = useState<RagStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'hybrid' | 'keyword' | 'vector'>('hybrid')
  const [hits, setHits] = useState<RagHit[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newText, setNewText] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [d, s]: any = await Promise.all([ragAPI.documents(), ragAPI.stats()])
      setDocs(d?.documents || [])
      setStats(s || null)
    } catch { setDocs([]); setStats(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSearch = async () => {
    if (!query.trim()) { setHits(null); return }
    setSearching(true)
    try {
      const res: any = await ragAPI.search(query, 8, mode)
      setHits(res?.results || [])
    } catch { toast.error('Search failed') }
    finally { setSearching(false) }
  }

  const handleIngest = async () => {
    if (!newText.trim()) return
    try {
      const res: any = await ragAPI.ingest(newText, newTitle.trim() || 'untitled')
      if (res?.deduplicated) toast('Already indexed (duplicate content)', { icon: 'ℹ️' })
      else toast.success(`Indexed "${res?.title}" (${res?.chunks} chunks)`)
      setNewText(''); setNewTitle(''); setAdding(false)
      fetchAll()
    } catch { toast.error('Ingestion failed') }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document and all its chunks from the knowledge base?')) return
    try {
      await ragAPI.deleteDocument(id)
      setDocs(prev => prev.filter(d => d.id !== id))
      toast.success('Deleted')
      fetchAll()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-white">Knowledge Base</h1>
        <button onClick={() => setAdding(v => !v)} className="btn-primary text-xs gap-1">
          {adding ? <X className="w-3.5 h-3.5"/> : <Plus className="w-3.5 h-3.5"/>}
          {adding ? 'Cancel' : 'Add Document'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['Documents', String(stats.documents)],
            ['Chunks', String(stats.chunks)],
            ['Characters', stats.total_chars.toLocaleString()],
            ['Engines', `BM25${stats.fts5 ? '(FTS5)' : ''} + ${stats.vector_engine}`],
          ].map(([k, v]) => (
            <div key={k} className="card p-3">
              <div className="text-[11px] text-slate-400">{k}</div>
              <div className="text-sm font-semibold text-white truncate">{v}</div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="card p-4 space-y-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                 placeholder="Title (e.g. architecture-notes.md)" className="input"/>
          <textarea value={newText} onChange={e => setNewText(e.target.value)} rows={5}
                    placeholder="Paste text, markdown, or code to index..."
                    className="input resize-none"/>
          <button onClick={handleIngest} className="btn-primary text-xs">Index Document</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input value={query} onChange={e => setQuery(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSearch()}
                 placeholder="Ask the knowledge base..." className="input pl-9"/>
        </div>
        <select value={mode} onChange={e => setMode(e.target.value as any)}
                className="input w-auto">
          <option value="hybrid">Hybrid</option>
          <option value="keyword">Keyword (BM25)</option>
          <option value="vector">Vector</option>
        </select>
        <button onClick={handleSearch} disabled={searching} className="btn-secondary text-xs">
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : 'Search'}
        </button>
      </div>

      {hits !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">{hits.length} results</div>
            <button onClick={() => { setHits(null); setQuery('') }}
                    className="text-xs text-slate-400 hover:text-white">Clear</button>
          </div>
          {hits.length === 0 && <div className="card p-4 text-sm text-slate-400">No matches found.</div>}
          {hits.map(h => (
            <div key={`${h.doc_id}-${h.ref}`} className="card p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <span className="text-purple-300 font-semibold">[{h.ref}]</span>
                <span className="text-slate-200 font-medium">{h.title}</span>
                {h.section && <span>— {h.section}</span>}
                <span className="ml-auto">score {h.score} · {h.engine}</span>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap line-clamp-4">{h.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4"/> Indexed Documents
        </h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-500"/></div>
        ) : docs.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-400">
            No documents indexed yet. Add one above, or POST to <code>/api/v1/rag/ingest</code>.
          </div>
        ) : docs.map(d => (
          <div key={d.id} className="card p-4 flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-500 shrink-0"/>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white font-medium truncate">{d.title}</div>
              <div className="text-[11px] text-slate-400 truncate">
                {d.doc_type} · {d.chunk_count} chunks · v{d.version} · {d.source}
              </div>
            </div>
            <button onClick={() => handleDelete(d.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4"/>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
