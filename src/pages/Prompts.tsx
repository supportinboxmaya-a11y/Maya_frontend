import { useEffect, useState } from 'react'
import { api, promptAPI } from '@/lib/api'
import { BookOpenText, RefreshCw, Loader2, Plus, Trash2, Play, X, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

interface PromptVar { name: string; description: string; default: string | null; required: boolean }
interface Prompt {
  id: string; name: string; body: string; description: string; category: string
  tags: string[]; variables: PromptVar[]; version: number; uses: number
  created_at: number; updated_at: number
}

const emptyForm = { name: '', body: '', description: '', category: 'general', tags: '' }

export function Prompts() {
  const [tab, setTab] = useState<'library' | 'optimizer'>('library')

  // ── Library tab state ──────────────────────────────
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [renderingId, setRenderingId] = useState<string | null>(null)
  const [renderValues, setRenderValues] = useState<Record<string, string>>({})
  const [renderOutput, setRenderOutput] = useState<string | null>(null)
  const [renderBusy, setRenderBusy] = useState(false)

  const fetchLibrary = async () => {
    setLoading(true)
    try {
      const res: any = await promptAPI.list(activeCategory, query)
      setPrompts(res?.prompts || [])
      setCategories(res?.categories || [])
    } catch { toast.error('Failed to load prompt library') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (tab === 'library') fetchLibrary() }, [tab, activeCategory])

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (p: Prompt) => {
    setEditingId(p.id)
    setForm({ name: p.name, body: p.body, description: p.description, category: p.category, tags: p.tags.join(', ') })
    setShowForm(true)
  }

  const saveForm = async () => {
    if (!form.name.trim() || !form.body.trim()) return toast.error('Name and body are required')
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    try {
      if (editingId) {
        await promptAPI.update(editingId, { name: form.name, body: form.body, description: form.description, category: form.category, tags })
        toast.success('Prompt updated')
      } else {
        await promptAPI.create({ name: form.name, body: form.body, description: form.description, category: form.category, tags })
        toast.success('Prompt created')
      }
      setShowForm(false)
      fetchLibrary()
    } catch (e: any) { toast.error(e?.detail || 'Save failed') }
  }

  const deletePrompt = async (id: string) => {
    if (!window.confirm('Delete this prompt?')) return
    try {
      await promptAPI.delete(id)
      setPrompts(prev => prev.filter(p => p.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  const openRender = (p: Prompt) => {
    setRenderingId(p.id)
    const defaults: Record<string, string> = {}
    p.variables.forEach(v => { defaults[v.name] = v.default || '' })
    setRenderValues(defaults)
    setRenderOutput(null)
  }

  const runRender = async (run: boolean) => {
    if (!renderingId) return
    setRenderBusy(true)
    try {
      const res: any = await promptAPI.render(renderingId, renderValues, run)
      setRenderOutput(run ? (res.response || res.rendered) : res.rendered)
      fetchLibrary() // uses counter went up
    } catch (e: any) { toast.error(e?.detail || 'Render failed — check required variables') }
    finally { setRenderBusy(false) }
  }

  // ── Optimizer tab state (was previously the entire page) ──
  const [optData, setOptData] = useState<any>(null)
  const [optLoading, setOptLoading] = useState(true)
  const fetchOptimizer = async () => {
    setOptLoading(true)
    try { setOptData(await api.get('/learning/prompts')) } catch { setOptData(null) }
    setOptLoading(false)
  }
  useEffect(() => { if (tab === 'optimizer') fetchOptimizer() }, [tab])
  const optTasks = Object.entries(optData?.optimizer || {})

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="flex items-center gap-2 text-lg font-bold text-white"><BookOpenText className="w-6 h-6 text-purple-400"/>Prompt Library</h1>
        <div className="flex gap-2">
          {tab === 'library' && <button onClick={openCreate} className="btn-primary text-sm"><Plus className="w-4 h-4"/>New Prompt</button>}
          <button onClick={() => tab === 'library' ? fetchLibrary() : fetchOptimizer()} aria-label="Refresh" className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#1e2130]">
        <button onClick={() => setTab('library')}
          className={`px-3 py-2 text-sm ${tab === 'library' ? 'text-white border-b-2 border-purple-400' : 'text-slate-500'}`}>Templates</button>
        <button onClick={() => setTab('optimizer')}
          className={`px-3 py-2 text-sm ${tab === 'optimizer' ? 'text-white border-b-2 border-purple-400' : 'text-slate-500'}`}>Optimizer report</button>
      </div>

      {tab === 'library' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLibrary()}
              placeholder="Search prompts..." className="input flex-1"/>
            <button onClick={fetchLibrary} className="btn-secondary px-3">Search</button>
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setActiveCategory('')}
                className={`px-2.5 py-1 rounded-full text-xs ${!activeCategory ? 'bg-purple-500/20 text-purple-300' : 'bg-[#14161e] text-slate-400'}`}>All</button>
              {categories.map(c => (
                <button key={c.category} onClick={() => setActiveCategory(c.category)}
                  className={`px-2.5 py-1 rounded-full text-xs ${activeCategory === c.category ? 'bg-purple-500/20 text-purple-300' : 'bg-[#14161e] text-slate-400'}`}>
                  {c.category} ({c.count})
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
          ) : prompts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-[15px] text-slate-400">No prompts yet.</p>
              <p className="text-sm text-slate-500 mt-1">Create one with "New Prompt" — use {'{{variable}}'} in the body for fill-in-the-blank templates.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {prompts.map(p => (
                <div key={p.id} className="card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold text-white">{p.name}</span>
                        <span className="badge badge-purple text-[10px]">{p.category}</span>
                        <span className="text-[10px] text-slate-500">v{p.version} · used {p.uses}x</span>
                      </div>
                      {p.description && <p className="text-xs text-slate-400 mt-1">{p.description}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openRender(p)} className="text-slate-500 hover:text-emerald-400" title="Render"><Play className="w-4 h-4"/></button>
                      <button onClick={() => openEdit(p)} className="text-slate-500 hover:text-blue-400" title="Edit"><Pencil className="w-4 h-4"/></button>
                      <button onClick={() => deletePrompt(p.id)} className="text-slate-500 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">{p.body}</pre>
                  {p.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {p.tags.map(t => <span key={t} className="text-[10px] text-slate-500 bg-[#14161e] px-1.5 py-0.5 rounded">#{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        optLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div> :
        optTasks.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-[15px] text-slate-400">No optimizer data yet.</p>
            <p className="text-sm text-slate-500 mt-1">Variants and win-rates appear as Maya learns from feedback.</p>
          </div>
        ) : optTasks.map(([task, variants]) => (
          <div key={task} className="card p-4">
            <div className="text-[15px] font-semibold text-white mb-3">{task}</div>
            <pre className="text-sm text-slate-300 overflow-x-auto">{JSON.stringify(variants, null, 2)}</pre>
          </div>
        ))
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{editingId ? 'Edit Prompt' : 'New Prompt'}</h3>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input w-full"/>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={6}
              placeholder="Body — use {{variable}} for fill-in-the-blank fields" className="input w-full resize-none font-mono text-xs"/>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="input w-full"/>
            <div className="flex gap-2">
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Category" className="input flex-1"/>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Tags, comma separated" className="input flex-1"/>
            </div>
            <div className="flex gap-2">
              <button onClick={saveForm} className="btn-primary">Save</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Render modal */}
      {renderingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setRenderingId(null)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Render Prompt</h3>
              <button onClick={() => setRenderingId(null)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            {Object.keys(renderValues).length === 0 ? (
              <p className="text-xs text-slate-500">No variables — this prompt renders as-is.</p>
            ) : Object.keys(renderValues).map(name => (
              <div key={name}>
                <label className="text-xs text-slate-400">{name}</label>
                <input value={renderValues[name]} onChange={e => setRenderValues({ ...renderValues, [name]: e.target.value })} className="input w-full"/>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => runRender(false)} disabled={renderBusy} className="btn-secondary">
                {renderBusy ? <Loader2 className="w-4 h-4 animate-spin"/> : null}Preview
              </button>
              <button onClick={() => runRender(true)} disabled={renderBusy} className="btn-primary">
                {renderBusy ? <Loader2 className="w-4 h-4 animate-spin"/> : null}Run through Maya
              </button>
            </div>
            {renderOutput !== null && (
              <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{renderOutput}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
