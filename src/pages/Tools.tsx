import { useState } from 'react'
import { mockTools } from '@/lib/mock-data'
import { Search, Plus, Play, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = ["all","web","file","code","system","media","communication","developer"]

const catBadge: Record<string,string> = {
  web:"badge-blue",file:"badge-green",code:"badge-purple",
  system:"badge-red",media:"badge-yellow",communication:"badge-blue",developer:"badge-purple"
}

export function Tools() {
  const [tools, setTools] = useState(mockTools)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")

  const filtered = tools.filter(t=>{
    const matchCat = category==="all" || t.category===category
    const matchSearch = !search || t.name.includes(search) || t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tool Manager</h1>
          <p className="text-sm text-slate-400 mt-0.5">{tools.filter(t=>t.enabled).length} active / {tools.length} total</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4"/>Add Custom Tool</button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tools..." className="input pl-9 w-64"/>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {categories.map(c=>(
            <button key={c} onClick={()=>setCategory(c)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                category===c ? "bg-purple-500 text-white" : "hover:bg-[#1a1d2e] text-slate-400")}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tool=>(
          <div key={tool.name} className="card-hover p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1a1d2e] flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-slate-500"/>
                </div>
                <div>
                  <div className="text-sm font-mono font-medium text-white">{tool.name}</div>
                  <span className={cn("badge mt-0.5", catBadge[tool.category]||"badge-default")}>{tool.category}</span>
                </div>
              </div>
              <button onClick={()=>setTools(prev=>prev.map(t=>t.name===tool.name?{...t,enabled:!t.enabled}:t))}
                className={cn("w-10 h-5 rounded-full transition-all relative",tool.enabled?"bg-purple-500":"bg-slate-700")}>
                <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",tool.enabled?"left-5":"left-0.5")}/>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">{tool.description}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#1a1d2e] rounded-lg p-2">
                <div className="text-sm font-bold text-white">{tool.call_count}</div>
                <div className="text-xs text-slate-500">Calls</div>
              </div>
              <div className="bg-[#1a1d2e] rounded-lg p-2">
                <div className="text-sm font-bold text-emerald-400">{tool.success_rate}%</div>
                <div className="text-xs text-slate-500">Success</div>
              </div>
              <div className="bg-[#1a1d2e] rounded-lg p-2">
                <div className="text-sm font-bold text-white">{tool.avg_duration_ms}ms</div>
                <div className="text-xs text-slate-500">Avg</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#1e2130]">
              <button className="w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white py-1.5 transition-colors">
                <Play className="w-3 h-3"/>Test Tool
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}