import { useEffect, useState } from 'react'
import { memoryAPI } from '@/lib/api'
import { Loader2, Trash2, Plus, Search } from 'lucide-react'
import type { Memory } from '@/types'
import toast from 'react-hot-toast'

export function Memory() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')

  const fetchMemories = async () => {
    setLoading(true)
    try {
      const data = await memoryAPI.list({ limit: 50 })
      setMemories((data as any) || [])
    } catch { setMemories([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMemories() }, [])

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
      await memoryAPI.delete(id)
      setMemories(prev => prev.filter(m => m.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Memory Center</h1>
        <button onClick={() => setAdding(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add Memory</button>
      </div>
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
          {memories.map(m => (
            <div key={m.id} className="card p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">{m.content}</div>
                <div className="flex gap-2 mt-2">
                  <span className="badge badge-purple text-[10px]">{m.type}</span>
                  <span className="text-[10px] text-slate-600">{new Date(m.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(m.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
