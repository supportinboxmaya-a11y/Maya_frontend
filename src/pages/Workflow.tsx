import { useEffect, useState } from 'react'
import { workflowAPI, workflowDefAPI } from '@/lib/api'
import { Loader2, Plus, Play, Trash2, X } from 'lucide-react'
import type { Workflow as SimpleWorkflow } from '@/types'
import toast from 'react-hot-toast'

interface WFDef {
  id: string; name: string; description: string; steps: any[]
  created_at: number; updated_at: number; runs: number
}

const STEP_EXAMPLE = `[
  { "id": "step1", "name": "Research", "action": "prompt", "input": "Summarize the latest news about {{input.topic}}" },
  { "id": "step2", "name": "Review", "action": "prompt", "input": "Improve this summary: {{step1.output}}", "depends_on": ["step1"] }
]`

export function Workflow() {
  const [tab, setTab] = useState<'simple' | 'defs'>('simple')

  // ── Simple (legacy) tab ────────────────────────────
  const [workflows, setWorkflows] = useState<SimpleWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string|null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const createWorkflow = async () => {
    if (!name.trim()) return toast.error('Workflow name is required')
    try {
      await workflowAPI.create({ name: name.trim(), description: description.trim(), nodes: [], edges: [] })
      toast.success('Workflow created')
      setName(''); setDescription(''); setCreating(false)
      fetchWorkflows()
    } catch { toast.error('Failed to create workflow') }
  }

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const data = await workflowAPI.list()
      setWorkflows((data as any) || [])
    } catch { setWorkflows([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (tab === 'simple') fetchWorkflows() }, [tab])

  const runWorkflow = async (id: string) => {
    setRunning(id)
    try {
      await workflowAPI.run(id)
      toast.success('Workflow started!')
    } catch { toast.error('Failed to run workflow') }
    finally { setRunning(null) }
  }

  const deleteWorkflow = async (id: string) => {
    try {
      await workflowAPI.delete(id)
      setWorkflows(prev => prev.filter(w => w.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  // ── Declarative "Steps" tab ─────────────────────────
  const [defs, setDefs] = useState<WFDef[]>([])
  const [defsLoading, setDefsLoading] = useState(true)
  const [defRunning, setDefRunning] = useState<string | null>(null)
  const [showDefForm, setShowDefForm] = useState(false)
  const [defName, setDefName] = useState('')
  const [defDesc, setDefDesc] = useState('')
  const [defSteps, setDefSteps] = useState(STEP_EXAMPLE)
  const [runResult, setRunResult] = useState<{ id: string; result: any } | null>(null)

  const fetchDefs = async () => {
    setDefsLoading(true)
    try {
      const res: any = await workflowDefAPI.list()
      setDefs(res?.workflows || [])
    } catch { setDefs([]) }
    finally { setDefsLoading(false) }
  }

  useEffect(() => { if (tab === 'defs') fetchDefs() }, [tab])

  const createDef = async () => {
    if (!defName.trim()) return toast.error('Name is required')
    let steps: any[]
    try { steps = JSON.parse(defSteps) }
    catch { return toast.error('Steps must be valid JSON') }
    try {
      await workflowDefAPI.create({ name: defName.trim(), steps, description: defDesc.trim() })
      toast.success('Workflow created')
      setShowDefForm(false); setDefName(''); setDefDesc(''); setDefSteps(STEP_EXAMPLE)
      fetchDefs()
    } catch (e: any) { toast.error(e?.detail || 'Invalid workflow — check step ids/dependencies') }
  }

  const runDef = async (id: string) => {
    setDefRunning(id)
    setRunResult(null)
    try {
      const res = await workflowDefAPI.run(id)
      setRunResult({ id, result: res })
      toast.success('Run complete')
      fetchDefs()
    } catch (e: any) { toast.error(e?.detail || 'Run failed') }
    finally { setDefRunning(null) }
  }

  const deleteDef = async (id: string) => {
    if (!window.confirm('Delete this workflow?')) return
    try {
      await workflowDefAPI.delete(id)
      setDefs(prev => prev.filter(w => w.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Workflow Builder</h1>
        {tab === 'simple'
          ? <button onClick={() => setCreating(true)} className="btn-primary"><Plus className="w-4 h-4"/>New Workflow</button>
          : <button onClick={() => setShowDefForm(true)} className="btn-primary"><Plus className="w-4 h-4"/>New Workflow</button>}
      </div>

      <div className="flex gap-2 border-b border-[#1e2130]">
        <button onClick={() => setTab('simple')}
          className={`px-3 py-2 text-sm ${tab === 'simple' ? 'text-white border-b-2 border-purple-400' : 'text-slate-500'}`}>Simple</button>
        <button onClick={() => setTab('defs')}
          className={`px-3 py-2 text-sm ${tab === 'defs' ? 'text-white border-b-2 border-purple-400' : 'text-slate-500'}`}>Steps (conditions & dependencies)</button>
      </div>

      {tab === 'simple' ? (
        <>
          {creating && (
            <div className="card p-4 space-y-2">
              <input value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createWorkflow()}
                placeholder="Workflow name (used as the run goal)..." className="input"/>
              <input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)..." className="input"/>
              <div className="flex gap-2">
                <button onClick={createWorkflow} className="btn-primary">Create Workflow</button>
                <button onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
          ) : workflows.length === 0 ? (
            <div className="text-center text-slate-500 py-20">No workflows yet — create one!</div>
          ) : (
            <div className="space-y-3">
              {workflows.map(w => (
                <div key={w.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{w.name}</div>
                    {w.description && <div className="text-xs text-slate-500 mt-0.5">{w.description}</div>}
                    <div className="flex gap-3 mt-2 text-[10px] text-slate-600">
                      <span>Runs: {w.run_count}</span>
                      {w.last_run && <span>Last: {new Date(w.last_run).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => runWorkflow(w.id)} disabled={running === w.id}
                      className="btn-primary py-1.5 px-3 text-xs">
                      {running === w.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3"/>}
                      Run
                    </button>
                    <button onClick={() => deleteWorkflow(w.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-slate-500">Multi-step workflows with dependencies and conditional branching, defined as JSON. Steps reference each other's output via {'{{step_id.output}}'}.</p>
          {defsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
          ) : defs.length === 0 ? (
            <div className="text-center text-slate-500 py-20">No step workflows yet — create one!</div>
          ) : (
            <div className="space-y-3">
              {defs.map(w => (
                <div key={w.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{w.name}</div>
                      {w.description && <div className="text-xs text-slate-500 mt-0.5">{w.description}</div>}
                      <div className="text-[10px] text-slate-600 mt-1">{w.steps.length} steps · {w.runs} runs</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => runDef(w.id)} disabled={defRunning === w.id} className="btn-primary py-1.5 px-3 text-xs">
                        {defRunning === w.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3"/>}Run
                      </button>
                      <button onClick={() => deleteDef(w.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                  {runResult?.id === w.id && (
                    <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-x-auto max-h-64">{JSON.stringify(runResult.result, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showDefForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDefForm(false)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Step Workflow</h3>
              <button onClick={() => setShowDefForm(false)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <input value={defName} onChange={e => setDefName(e.target.value)} placeholder="Name" className="input w-full"/>
            <input value={defDesc} onChange={e => setDefDesc(e.target.value)} placeholder="Description (optional)" className="input w-full"/>
            <div>
              <label className="text-xs text-slate-400">Steps (JSON)</label>
              <textarea value={defSteps} onChange={e => setDefSteps(e.target.value)} rows={10}
                className="input w-full resize-none font-mono text-xs mt-1"/>
            </div>
            <div className="flex gap-2">
              <button onClick={createDef} className="btn-primary">Create</button>
              <button onClick={() => setShowDefForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
