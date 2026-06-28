import { useState } from 'react'
import { mockWorkflows } from '@/lib/mock-data'
import { GitBranch, Plus, Play, Edit3, Trash2, Clock, LayoutTemplate } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

const templates = [
  {name:"Daily News Digest",description:"Search, summarize and save news",nodes:4},
  {name:"Code Review Bot",description:"Review and improve code files",nodes:5},
  {name:"Research Assistant",description:"Research topics and write reports",nodes:6},
  {name:"Data Pipeline",description:"Fetch, process and store data",nodes:7},
]

export function Workflow() {
  const [view, setView] = useState<"list"|"builder">("list")

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflow Builder</h1>
          <p className="text-sm text-slate-400 mt-0.5">Build and automate multi-step agent workflows</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><LayoutTemplate className="w-4 h-4"/>Templates</button>
          <button className="btn-primary" onClick={()=>setView("builder")}><Plus className="w-4 h-4"/>New Workflow</button>
        </div>
      </div>

      {view==="list" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white">My Workflows</h2>
            {mockWorkflows.map(w=>(
              <div key={w.id} className="card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <GitBranch className="w-4 h-4 text-purple-400"/>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{w.name}</div>
                      {w.description && <div className="text-xs text-slate-500">{w.description}</div>}
                    </div>
                  </div>
                  <span className="badge-green">{w.run_count} runs</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>Updated {timeAgo(w.updated_at)}</span>
                  {w.last_run && <span>Last run {timeAgo(w.last_run)}</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary text-xs py-1.5 px-3"><Play className="w-3 h-3"/>Run</button>
                  <button className="btn-secondary text-xs py-1.5 px-3" onClick={()=>setView("builder")}><Edit3 className="w-3 h-3"/>Edit</button>
                  <button className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white">Templates</h2>
            {templates.map(t=>(
              <div key={t.name} className="card-hover p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <LayoutTemplate className="w-4 h-4 text-blue-400"/>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.description} · {t.nodes} nodes</div>
                    </div>
                  </div>
                  <button className="btn-secondary text-xs py-1.5 px-3" onClick={()=>setView("builder")}>Use</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs py-1.5 px-3" onClick={()=>setView("list")}>← Back</button>
            <span className="text-sm text-slate-400">New Workflow</span>
          </div>
          <div className="card p-0 overflow-hidden" style={{height:"600px"}}>
            <div className="flex h-full">
              <div className="w-52 border-r border-[#1e2130] p-4 bg-[#0f1117] space-y-2 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Node Types</div>
                {[
                  {type:"start",label:"Start",cls:"bg-emerald-500/20 text-emerald-400 border-emerald-500/30"},
                  {type:"llm",label:"LLM Call",cls:"bg-purple-500/20 text-purple-400 border-purple-500/30"},
                  {type:"tool",label:"Tool",cls:"bg-blue-500/20 text-blue-400 border-blue-500/30"},
                  {type:"condition",label:"Condition",cls:"bg-yellow-500/20 text-yellow-400 border-yellow-500/30"},
                  {type:"end",label:"End",cls:"bg-red-500/20 text-red-400 border-red-500/30"},
                ].map(n=>(
                  <div key={n.type} draggable className={`p-3 rounded-lg border cursor-grab text-xs font-medium text-center ${n.cls} hover:scale-105 transition-transform`}>{n.label}</div>
                ))}
              </div>
              <div className="flex-1 bg-[radial-gradient(#1e2130_1px,transparent_1px)] bg-[size:24px_24px] flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                  <p className="text-sm">Drag nodes from the left panel</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary"><Play className="w-4 h-4"/>Test Run</button>
            <button className="btn-secondary">Save Workflow</button>
          </div>
        </div>
      )}
    </div>
  )
}