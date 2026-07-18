import { useEffect, useState } from 'react'
import { workflowAPI, workflowDefAPI, workflowRunAPI } from '@/lib/api'
import { Loader2, Plus, Play, Trash2, X, GitMerge } from 'lucide-react'
import type { Workflow as SimpleWorkflow } from '@/types'
import toast from 'react-hot-toast'

interface WFDef {
  id: string; name: string; description: string; steps: any[]
  created_at: number; updated_at: number; runs: number
}

interface TaskNode {
  id: string; description: string; tool: string | null; agent: string | null
  depends_on: string[]; state: string; attempts: number; error: string | null
}
interface RunState { id: string; goal: string; status: string; created: number; nodes: TaskNode[] }

const STEP_EXAMPLE = `[
  { "id": "step1", "name": "Research", "action": "prompt", "input": "Summarize the latest news about {{input.topic}}" },
  { "id": "step2", "name": "Review", "action": "prompt", "input": "Improve this summary: {{step1.output}}", "depends_on": ["step1"] }
]`

export function Workflow() {
  const [tab, setTab] = useState<'simple' | 'defs' | 'plans'>('simple')

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
  const [editDefId, setEditDefId] = useState<string | null>(null)
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
      if (editDefId) {
        await workflowDefAPI.update(editDefId, { name: defName.trim(), steps, description: defDesc.trim() })
        toast.success('Workflow updated')
      } else {
        await workflowDefAPI.create({ name: defName.trim(), steps, description: defDesc.trim() })
        toast.success('Workflow created')
      }
      setShowDefForm(false); setEditDefId(null); setDefName(''); setDefDesc(''); setDefSteps(STEP_EXAMPLE)
      fetchDefs()
    } catch (e: any) { toast.error(e?.detail || 'Invalid workflow — check step ids/dependencies') }
  }

  const editDef = (w: WFDef) => {
    setEditDefId(w.id)
    setDefName(w.name)
    setDefDesc(w.description || '')
    setDefSteps(JSON.stringify(w.steps, null, 2))
    setShowDefForm(true)
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

  // ── Resumable plans tab (Phase 6) ───────────────────
  const [planGoal, setPlanGoal] = useState('')
  const [planning, setPlanning] = useState(false)
  const [runIds, setRunIds] = useState<string[]>([])
  const [runsLoading, setRunsLoading] = useState(true)
  const [openRun, setOpenRun] = useState<RunState | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [executingRun, setExecutingRun] = useState<string | null>(null)
  const [execResult, setExecResult] = useState<any>(null)

  const fetchRunIds = async () => {
    setRunsLoading(true)
    try {
      const res: any = await workflowRunAPI.runs()
      setRunIds(res?.checkpoints || [])
    } catch { setRunIds([]) }
    finally { setRunsLoading(false) }
  }

  useEffect(() => { if (tab === 'plans') fetchRunIds() }, [tab])

  const createPlan = async () => {
    if (!planGoal.trim()) return toast.error('Enter a goal first')
    setPlanning(true)
    try {
      const res: any = await workflowRunAPI.plan(planGoal.trim())
      toast.success('Plan created')
      setPlanGoal('')
      setOpenRun(res?.state || null)
      fetchRunIds()
    } catch (e: any) { toast.error(e?.detail || 'Planning failed') }
    finally { setPlanning(false) }
  }

  const viewRun = async (id: string) => {
    setExecResult(null)
    try {
      const res: any = await workflowRunAPI.state(id)
      setOpenRun(res)
    } catch { toast.error('Could not load this run') }
  }

  const executeRun = async (id: string) => {
    setExecutingRun(id)
    setExecResult(null)
    try {
      const res: any = await workflowRunAPI.execute(id)
      setExecResult(res)
      toast.success(`Run ${res.status}`)
      fetchRunIds()
    } catch (e: any) { toast.error(e?.detail || 'Execution failed') }
    finally { setExecutingRun(null) }
  }

  const cancelRun = async (id: string) => {
    setCancelling(id)
    try {
      await workflowRunAPI.cancel(id)
      toast.success('Cancel requested')
    } catch { toast.error('Not cancellable — the server may have restarted since this was planned') }
    finally { setCancelling(null) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Workflow Builder</h1>
        {tab === 'simple' && <button onClick={() => setCreating(true)} className="btn-primary"><Plus className="w-4 h-4"/>New Workflow</button>}
        {tab === 'defs' && <button onClick={() => { setShowDefForm(true); setEditDefId(null); setDefName(''); setDefDesc(''); setDefSteps(STEP_EXAMPLE) }} className="btn-primary"><Plus className="w-4 h-4"/>New Workflow</button>}
      </div>

      <div className="flex gap-2 border-b border-[#1e2130]">
        <button onClick={() => setTab('simple')}
          className={`px-3 py-2 text-sm ${tab === 'simple' ? 'text-white border-b-2 border-purple-400' : 'text-slate-500'}`}>Simple</button>
        <button onClick={() => setTab('defs')}
          className={`px-3 py-2 text-sm ${tab === 'defs' ? 'text-white border-b-2 border-purple-400' : 'text-slate-500'}`}>Steps (conditions & dependencies)</button>
        <button onClick={() => setTab('plans')}
          className={`px-3 py-2 text-sm ${tab === 'plans' ? 'text-white border-b-2 border-purple-400' : 'text-slate-500'}`}>Resumable Plans</button>
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
      ) : tab === 'defs' ? (
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
                      <button onClick={() => editDef(w)} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors" title="Edit"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
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
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Plans a dependency graph for a goal, checkpoints it, and can execute it (in dependency order, with automatic retry/recovery) — resumable if the server restarts mid-run.
          </p>
          <div className="card p-4 space-y-2">
            <div className="flex gap-2">
              <input value={planGoal} onChange={e => setPlanGoal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createPlan()}
                placeholder="Goal to plan..." className="input flex-1"/>
              <button onClick={createPlan} disabled={planning} className="btn-primary">
                {planning ? <Loader2 className="w-4 h-4 animate-spin"/> : <GitMerge className="w-4 h-4"/>}Plan
              </button>
            </div>
          </div>

          {runsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
          ) : runIds.length === 0 ? (
            <div className="text-center text-slate-500 py-16">No plans yet</div>
          ) : (
            <div className="space-y-2">
              {runIds.map(id => (
                <div key={id} className="card p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => viewRun(id)} className="text-sm text-slate-300 font-mono truncate flex-1 text-left hover:text-white">{id}</button>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => executeRun(id)} disabled={executingRun === id} className="btn-primary text-xs py-1 px-2">
                        {executingRun === id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3"/>}Run
                      </button>
                      <button onClick={() => cancelRun(id)} disabled={cancelling === id} className="btn-secondary text-xs py-1 px-2">
                        {cancelling === id ? <Loader2 className="w-3 h-3 animate-spin"/> : null}Cancel
                      </button>
                    </div>
                  </div>
                  {executingRun === null && execResult?.run_id === id && (
                    <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-x-auto max-h-64">{JSON.stringify(execResult, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {openRun && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setOpenRun(null)}>
              <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white truncate">{openRun.goal}</h3>
                  <button onClick={() => setOpenRun(null)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
                </div>
                <span className="badge badge-default text-[10px]">{openRun.status}</span>
                <div className="space-y-2">
                  {openRun.nodes.map(n => (
                    <div key={n.id} className="p-2 rounded-lg bg-[#0f1117] border border-[#1e2130]">
                      <div className="flex items-center gap-2">
                        <span className={`badge text-[10px] ${n.state === 'done' ? 'badge-green' : n.state === 'failed' ? 'badge-red' : 'badge-default'}`}>{n.state}</span>
                        <span className="text-xs text-slate-300 truncate">{n.description}</span>
                      </div>
                      {n.depends_on.length > 0 && <div className="text-[10px] text-slate-600 mt-1">depends on: {n.depends_on.join(', ')}</div>}
                      {n.error && <div className="text-[10px] text-red-400 mt-1">{n.error}</div>}
                    </div>
                  ))}
                </div>
              </div>
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
