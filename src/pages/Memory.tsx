import { useState } from 'react'
import { mockMemories } from '@/lib/mock-data'
import { timeAgo } from '@/lib/utils'
import { Search, Plus, Trash2, Brain, Clock, Database, BookOpen, Cpu, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

const layers = [
  {type:"all",label:"All Memory",icon:Brain,color:"text-white"},
  {type:"short_term",label:"Short-Term",icon:Clock,color:"text-blue-400"},
  {type:"long_term",label:"Long-Term",icon:Database,color:"text-purple-400"},
  {type:"episodic",label:"Episodic",icon:BookOpen,color:"text-emerald-400"},
  {type:"semantic",label:"Semantic",icon:Cpu,color:"text-yellow-400"},
  {type:"vector",label:"Vector",icon:Network,color:"text-red-400"},
]

const typeBadge: Record<string,string> = {
  short_term:"badge-blue",long_term:"badge-purple",episodic:"badge-green",
  semantic:"badge-yellow",vector:"badge-red",general:"badge-default",
  chat:"badge-blue",task_episode:"badge-green"
}

export function Memory() {
  const [activeLayer, setActiveLayer] = useState("all")
  const [search, setSearch] = useState("")
  const [memories, setMemories] = useState(mockMemories)

  const filtered = memories.filter(m=>{
    const matchLayer = activeLayer==="all" || m.type===activeLayer
    const matchSearch = !search || m.content.toLowerCase().includes(search.toLowerCase())
    return matchLayer && matchSearch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Memory Center</h1>
          <p className="text-sm text-slate-400 mt-0.5">5-layer memory system — {memories.length} total</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4"/>Add Memory</button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {layers.map(layer=>{
          const count = layer.type==="all" ? memories.length : memories.filter(m=>m.type===layer.type).length
          return (
            <div key={layer.type} onClick={()=>setActiveLayer(layer.type)}
              className={cn("card-hover p-4 cursor-pointer", activeLayer===layer.type && "border-purple-500/40 bg-purple-500/5")}>
              <layer.icon className={cn("w-5 h-5 mb-2",layer.color)}/>
              <div className="text-lg font-bold text-white">{count}</div>
              <div className="text-xs text-slate-400 mt-0.5">{layer.label}</div>
            </div>
          )
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search memories..." className="input pl-9"/>
      </div>

      <div className="space-y-3">
        {filtered.length===0 && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-30"/>
            <p>No memories found</p>
          </div>
        )}
        {filtered.map(mem=>(
          <div key={mem.id} className="card-hover p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-relaxed">{mem.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn("badge", typeBadge[mem.type]||"badge-default")}>{mem.type}</span>
                  <span className="text-xs text-slate-500">{timeAgo(mem.timestamp)}</span>
                </div>
              </div>
              <button onClick={()=>setMemories(prev=>prev.filter(m=>m.id!==mem.id))}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 opacity-60 hover:opacity-100 transition-all">
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}