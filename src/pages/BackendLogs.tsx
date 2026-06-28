import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Loader2, RefreshCw } from 'lucide-react'

type LogTab = "llm" | "tool" | "error"

export function BackendLogs() {
  const [tab, setTab] = useState<LogTab>("llm")
  const [llmLogs, setLlmLogs] = useState<any[]>([])
  const [toolLogs, setToolLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const [llm, tool] = await Promise.all([
        api.get("/logs/llm?limit=50"),
        api.get("/logs/tools?limit=50"),
      ])
      setLlmLogs((llm as any) || [])
      setToolLogs((tool as any) || [])
    } catch {
      setLlmLogs([]); setToolLogs([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs() }, [])

  const tabs: [LogTab, string, number][] = [
    ["llm", "LLM Calls", llmLogs.length],
    ["tool", "Tool Logs", toolLogs.length],
    ["error", "Errors", [...llmLogs, ...toolLogs].filter(l => !l.success).length],
  ]

  const currentLogs = tab === "llm" ? llmLogs : tab === "tool" ? toolLogs : [...llmLogs, ...toolLogs].filter(l => !l.success)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Backend Logs</h1>
        <button onClick={fetchLogs} className="btn-secondary gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>
      <div className="flex gap-2">
        {tabs.map(([id, label, count]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-purple-600 text-white" : "bg-[#1a1d2e] text-slate-400"}`}>
            {label} <span className="ml-1 text-xs opacity-70">{count}</span>
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : currentLogs.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No logs found</div>
      ) : (
        <div className="space-y-2">
          {currentLogs.map((log: any) => (
            <div key={log.id} className="card p-3 text-xs font-mono">
              <div className="flex items-center justify-between mb-1">
                <span className="text-purple-400">{log.provider || log.tool_name}</span>
                <span className={log.success ? "text-emerald-400" : "text-red-400"}>{log.success ? "✓" : "✗"}</span>
              </div>
              <div className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
              {log.total_tokens && <div className="text-slate-500">Tokens: {log.total_tokens} • Cost: ${log.cost_usd?.toFixed(5)}</div>}
              {log.duration_ms && <div className="text-slate-500">Duration: {log.duration_ms}ms</div>}
              {log.error && <div className="text-red-400 mt-1">{log.error}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
