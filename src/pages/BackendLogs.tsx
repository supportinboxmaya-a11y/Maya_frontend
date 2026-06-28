import { useState } from 'react'
import { mockLLMLogs, mockToolLogs } from '@/lib/mock-data'
import { formatCost, formatTokens, timeAgo } from '@/lib/utils'
import { Search, Terminal, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

type LogTab = "llm"|"tool"|"error"

export function BackendLogs() {
  const [tab, setTab] = useState<LogTab>("llm")
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string|null>(null)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">LLM & Tool Logs</h1>
        <p className="text-sm text-slate-400 mt-0.5">Inspect every API call and tool execution</p>
      </div>

      <div className="flex items-center gap-1 bg-[#14161e] border border-[#1e2130] rounded-xl p-1 w-fit">
        {([["llm","LLM Calls",mockLLMLogs.length],["tool","Tool Logs",mockToolLogs.length],["error","Errors",1]] as [LogTab,string,number][]).map(([id,label,count])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",tab===id?"bg-[#0f1117] text-white shadow-sm":"text-slate-500 hover:text-slate-300")}>
            {label}<span className={cn("badge",id==="error"?"badge-red":"badge-default")}>{count}</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search logs..." className="input pl-9"/>
      </div>

      {tab==="llm" && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2130]">
                  {["Time","Provider","Model","Input","Output","Total","Cost","Latency","Status"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockLLMLogs.map(log=>(
                  <tr key={log.id} className="border-b border-[#1e2130]/50 hover:bg-[#1a1d2e] cursor-pointer transition-colors" onClick={()=>setExpanded(expanded===log.id?null:log.id)}>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{timeAgo(log.timestamp)}</td>
                    <td className="px-4 py-3"><span className="badge-purple capitalize">{log.provider}</span></td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{log.model}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{formatTokens(log.input_tokens)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{formatTokens(log.output_tokens)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-white font-medium">{formatTokens(log.total_tokens)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-emerald-400">{formatCost(log.cost_usd)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{log.response_time_ms}ms</td>
                    <td className="px-4 py-3"><span className={log.success?"badge-green":"badge-red"}>{log.success?"OK":"ERR"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="tool" && (
        <div className="space-y-2">
          {mockToolLogs.map(log=>(
            <div key={log.id} className="card-hover p-4">
              <div className="flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",log.success?"bg-emerald-500/15":"bg-red-500/15")}>
                  <Cpu className={cn("w-4 h-4",log.success?"text-emerald-400":"text-red-400")}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono font-medium text-white">{log.tool_name}</span>
                    <span className={log.success?"badge-green":"badge-red"}>{log.success?"success":"failed"}</span>
                    <span className="text-xs text-slate-500 ml-auto">{log.duration_ms}ms · {timeAgo(log.timestamp)}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">Input: {JSON.stringify(log.input).slice(0,80)}...</div>
                  {log.output && <div className="text-xs text-slate-400 mt-1 font-mono">Output: {log.output.slice(0,100)}...</div>}
                  {log.error && <div className="text-xs text-red-400 mt-1">{log.error}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="error" && (
        <div className="card p-4">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Terminal className="w-4 h-4 text-red-400 mt-0.5"/>
            <div>
              <div className="text-sm font-medium text-red-400 mb-1">FileNotFoundError</div>
              <div className="text-xs font-mono text-slate-400">tools/files/reader.py line 45: File not found: data.csv</div>
              <div className="text-xs text-slate-500 mt-1">Task: t4 · 2 hours ago</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}