import { useEffect, useState } from 'react'
import { agentsAPI, autonomousAPI, brainAPI } from '@/lib/api'
import { Loader2, Bot, Play, RefreshCw, Network, MessageCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

interface AgentRow { name: string; role?: string; skills?: string[]; permissions?: string[]; status?: string; [k: string]: unknown }
interface BusMessage { sender?: string; recipient?: string; content?: string; ts?: string; [k: string]: unknown }

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

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [a, m] = await Promise.allSettled([agentsAPI.list(), agentsAPI.messages(30)])
      if (a.status === 'fulfilled') setAgents(((a.value as any)?.agents) || [])
      if (m.status === 'fulfilled') setMessages(((m.value as any)?.messages) || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400"/> Agent Command
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Multi-agent roster, orchestration planning & autonomous runs</p>
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
          <button onClick={runAutonomous} disabled={running} className="btn-primary">
            {running ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
            Autonomous Run
          </button>
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3"/> Autonomous runs require FLAG_AUTONOMOUS=true on the backend.
        </p>
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
            <h2 className="text-sm font-semibold text-white mb-3">Registered Agents ({agents.length})</h2>
            {agents.length === 0 ? (
              <div className="card p-6 text-center text-xs text-slate-500">
                No agents returned — the multi-agent system may not be loaded on the backend.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map(a => (
                  <div key={a.name} className="card-hover p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-white text-sm">{a.name}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/15 text-purple-300">{a.role || 'agent'}</span>
                    </div>
                    {a.skills && a.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {a.skills.slice(0, 5).map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-[#1a1d2e] text-slate-400">{s}</span>
                        ))}
                      </div>
                    )}
                    {a.permissions && a.permissions.length > 0 && (
                      <div className="text-[10px] text-slate-500 truncate">perms: {a.permissions.join(', ')}</div>
                    )}
                  </div>
                ))}
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
                    <span className="text-purple-300 font-medium">{m.sender || '?'}</span>
                    <span className="text-slate-600"> → </span>
                    <span className="text-blue-300 font-medium">{m.recipient || '?'}</span>
                    <div className="text-slate-400 mt-1">{m.content ? String(m.content) : JSON.stringify(m)}</div>
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
