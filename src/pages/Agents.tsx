import { useEffect, useState, useRef } from 'react'
import { agentsAPI, autonomousAPI, brainAPI, taskAPI } from '@/lib/api'
import { Loader2, Bot, Play, RefreshCw, Network, MessageCircle, Zap, Users, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface AgentRow { name: string; role?: string; skills?: string[]; permissions?: string[]; status?: string; [k: string]: unknown }
interface BusMessage { from?: string; to?: string; content?: unknown; ts?: number; [k: string]: unknown }

export function Agents() {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [messages, setMessages] = useState<BusMessage[]>([])
  const [loading, setLoading] = useState(true)

  // orchestrate / autonomous
  const [goal, setGoal] = useState('')
  const [planning, setPlanning] = useState(false)
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null)

  // real multi-agent execution (this is what actually runs Orchestrator.run())
  const [executing, setExecuting] = useState(false)
  const [execTask, setExecTask] = useState<any>(null)
  const [reflecting, setReflecting] = useState(false)
  const [critique, setCritique] = useState<any>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [a, m] = await Promise.allSettled([agentsAPI.list(), agentsAPI.messages(30)])
      if (a.status === 'fulfilled') setAgents(((a.value as any)?.agents) || [])
      if (m.status === 'fulfilled') setMessages(((m.value as any)?.messages) || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const orchestrate = async () => {
    if (!goal.trim()) return toast.error('Enter a goal first')
    setPlanning(true); setPlan(null)
    try {
      const res = await agentsAPI.orchestrate(goal)
      setPlan(res as Record<string, unknown>)
      toast.success('Plan created')
    } catch (e: any) {
      // fallback: brain analyze only
      try {
        const res = await brainAPI.analyze(goal)
        setPlan({ analysis: res })
        toast.success('Analysis complete (orchestrator unavailable)')
      } catch { toast.error(e?.detail || 'Orchestration failed') }
    } finally { setPlanning(false) }
  }

  const runAutonomous = async () => {
    if (!goal.trim()) return toast.error('Enter a goal first')
    setRunning(true); setRunResult(null)
    try {
      const res = await autonomousAPI.run(goal)
      setRunResult(res as Record<string, unknown>)
      toast.success('Autonomous run complete')
      fetchAll()
    } catch (e: any) {
      toast.error(e?.detail || 'Run failed — is FLAG_AUTONOMOUS=true set on the backend?')
    } finally { setRunning(false) }
  }

  // NOTE: the backend's dedicated multi-agent Orchestrator has a run()
  // method (agents/orchestrator.py) but it isn't exposed over the API —
  // only .plan() is (via POST /agents/orchestrate, used by "Plan" above).
  // Until that endpoint exists, this runs the goal through Maya's normal
  // task pipeline (POST /tasks), which returns the same pollable task
  // shape {id, status, current_phase, steps, result} used below.
  const executeMultiAgent = async () => {
    if (!goal.trim()) return toast.error('Enter a goal first')
    setExecuting(true); setExecTask(null); setCritique(null)
    try {
      const res: any = await taskAPI.create(goal)
      const taskId = res.id
      pollRef.current = setInterval(async () => {
        try {
          const updated: any = await taskAPI.get(taskId)
          setExecTask(updated)
          if (updated.status === 'done' || updated.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current)
            setExecuting(false)
            toast[updated.status === 'done' ? 'success' : 'error'](
              updated.status === 'done' ? 'Run complete' : (updated.error || 'Run failed'))
            fetchAll()
          }
        } catch { /* keep polling */ }
      }, 2000)
    } catch (e: any) {
      setExecuting(false)
      toast.error(e?.detail || 'Execution failed')
    }
  }

  const reflect = async () => {
    if (!execTask?.id) return
    setReflecting(true)
    try {
      const res: any = await taskAPI.reflect(execTask.id, false)
      setCritique(res.critique)
    } catch (e: any) { toast.error(e?.detail || 'Reflection failed') }
    finally { setReflecting(false) }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400"/> Agent Command
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Multi-agent roster, orchestration planning & real execution</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>

      {/* Goal console */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Goal Console</h2>
        <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2}
          placeholder="Describe a goal, e.g. 'Research top 3 competitors and summarize findings'..."
          className="input resize-none"/>
        <div className="flex gap-2 flex-wrap">
          <button onClick={orchestrate} disabled={planning} className="btn-secondary">
            {planning ? <Loader2 className="w-4 h-4 animate-spin"/> : <Network className="w-4 h-4"/>}
            Plan (no execution)
          </button>
          <button onClick={executeMultiAgent} disabled={executing} className="btn-primary">
            {executing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Users className="w-4 h-4"/>}
            Execute
          </button>
          <button onClick={runAutonomous} disabled={running} className="btn-secondary">
            {running ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
            Autonomous Run
          </button>
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3"/> "Execute" runs Maya's standard task pipeline. "Autonomous Run" requires FLAG_AUTONOMOUS=true on the backend.
        </p>

        {execTask && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className={`badge text-[10px] ${execTask.status === 'done' ? 'badge-green' : execTask.status === 'failed' ? 'badge-red' : 'badge-blue'}`}>
                {execTask.current_phase || execTask.status}
              </span>
              {executing && <Loader2 className="w-3 h-3 animate-spin text-purple-400"/>}
            </div>
            {execTask.steps?.map((s: any) => (
              <div key={s.step} className={`text-xs rounded-lg p-2 border ${s.success === true ? 'border-emerald-500/30 bg-emerald-500/10' : s.success === false ? 'border-red-500/30 bg-red-500/10' : 'border-blue-500/30 bg-blue-500/10 animate-pulse'}`}>
                <span className="text-purple-300 font-medium">{s.tool || 'agent'}</span>
                <span className="text-slate-400"> — {s.description}</span>
                {s.error && <div className="text-red-400 mt-0.5">{s.error}</div>}
              </div>
            ))}
            {execTask.status === 'done' && (
              <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                {execTask.result}
              </div>
            )}
            {(execTask.status === 'done' || execTask.status === 'failed') && (
              <div className="space-y-2">
                <button onClick={reflect} disabled={reflecting} className="btn-secondary text-xs py-1.5 px-3">
                  {reflecting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>}
                  Reflect on this result
                </button>
                {critique && (
                  <div className="text-xs bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Self-critique score:</span>
                      <span className={`font-semibold ${critique.score >= 7 ? 'text-emerald-400' : critique.score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>{critique.score}/10</span>
                    </div>
                    {critique.issues?.length > 0 && (
                      <ul className="list-disc list-inside text-slate-400">
                        {critique.issues.map((iss: string, i: number) => <li key={i}>{iss}</li>)}
                      </ul>
                    )}
                    {critique.suggestion && critique.suggestion.toLowerCase() !== 'none' && (
                      <div className="text-purple-300">Suggestion: {critique.suggestion}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {plan && (
          <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-x-auto max-h-64">
            {JSON.stringify(plan, null, 2)}
          </pre>
        )}
        {runResult && (
          <pre className="text-xs text-emerald-300/90 bg-[#0f1117] border border-emerald-500/20 rounded-lg p-3 overflow-x-auto max-h-64">
            {JSON.stringify(runResult, null, 2)}
          </pre>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : (
        <>
          {/* Agent roster */}
          <div>
            <h2 className="text-sm font-semibold text-white">Registered Agents ({agents.length})</h2>
            <p className="text-xs text-slate-500 mb-3">Reference roster — who's available and what they're allowed to do. Not clickable; agents get assigned automatically when you run a goal above.</p>
            {agents.length === 0 ? (
              <div className="card p-6 text-center text-xs text-slate-500">
                No agents returned — the multi-agent system may not be loaded on the backend.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map(a => {
                  const total = (a.ok as number || 0) + (a.errors as number || 0)
                  const neverRun = total === 0
                  const status = neverRun ? 'never run' : (a.status as string || 'healthy')
                  const dotColor = neverRun ? 'bg-slate-600' : status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'
                  return (
                    <div key={a.name} className="card-hover p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white text-sm flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dotColor}`} title={status}/>
                          {a.name}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/15 text-purple-300">{a.role || 'agent'}</span>
                      </div>
                      {a.skills && (a.skills as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(a.skills as string[]).slice(0, 5).map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-[#1a1d2e] text-slate-400">{s}</span>
                          ))}
                        </div>
                      )}
                      {a.permissions && (a.permissions as string[]).length > 0 && (
                        <div className="text-[10px] text-slate-500 truncate">perms: {(a.permissions as string[]).join(', ')}</div>
                      )}
                      <div className="text-[10px] text-slate-500">
                        {neverRun ? 'Never assigned a task yet' :
                          `${a.ok} ok / ${a.errors} error${(a.errors as number) !== 1 ? 's' : ''} (${Math.round((a.success_rate as number || 0) * 100)}%)`}
                      </div>
                      {a.last_error && (
                        <div className="text-[10px] text-red-400 truncate" title={a.last_error as string}>⚠ {a.last_error as string}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Message bus */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-400"/> Agent Message Bus
            </h2>
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500">No inter-agent messages yet. Messages appear here during orchestrated runs.</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className="text-xs bg-[#0f1117] border border-[#1e2130] rounded-lg p-2.5">
                    <span className="text-purple-300 font-medium">{m.from || '?'}</span>
                    <span className="text-slate-600"> → </span>
                    <span className="text-blue-300 font-medium">{m.to || '?'}</span>
                    <div className="text-slate-400 mt-1">
                      {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
