import { useState } from 'react'
import { mockPlugins } from '@/lib/mock-data'
import { Search, Download, Trash2, ToggleLeft, ToggleRight, Star, Package, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Plugins() {
  const [plugins, setPlugins] = useState(mockPlugins)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const filtered = plugins.filter(p=>{
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter==="all" || (filter==="installed"?p.installed:!p.installed)
    return matchSearch && matchFilter
  })

  const toggle = (id:string) => setPlugins(prev=>prev.map(p=>p.id===id?{...p,enabled:!p.enabled}:p))
  const install = (id:string) => setPlugins(prev=>prev.map(p=>p.id===id?{...p,installed:true,enabled:true}:p))
  const uninstall = (id:string) => setPlugins(prev=>prev.map(p=>p.id===id?{...p,installed:false,enabled:false}:p))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plugin Marketplace</h1>
          <p className="text-sm text-slate-400 mt-0.5">{plugins.filter(p=>p.installed).length} installed · {plugins.length} available</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4"/>Create Plugin</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search plugins..." className="input pl-9 w-64"/>
        </div>
        <div className="flex gap-1">
          {["all","installed","available"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",filter===f?"bg-purple-500 text-white":"hover:bg-[#1a1d2e] text-slate-400")}>{f}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(plugin=>(
          <div key={plugin.id} className="card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-400"/>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{plugin.name}</div>
                  <div className="text-xs text-slate-500">v{plugin.version} · {plugin.author}</div>
                </div>
              </div>
              {plugin.installed && (
                <button onClick={()=>toggle(plugin.id)}>
                  {plugin.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400"/> : <ToggleLeft className="w-5 h-5 text-slate-500"/>}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">{plugin.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {plugin.tools.map(t=><span key={t} className="badge-purple font-mono text-[10px]">{t}</span>)}
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-xs text-yellow-400"><Star className="w-3 h-3 fill-current"/>{plugin.rating}</div>
              <div className="text-xs text-slate-500">{plugin.downloads.toLocaleString()} downloads</div>
            </div>
            <div className="pt-3 border-t border-[#1e2130]">
              {plugin.installed ? (
                <div className="flex gap-2">
                  <span className="badge-green flex-1 justify-center">Installed</span>
                  <button onClick={()=>uninstall(plugin.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              ) : (
                <button onClick={()=>install(plugin.id)} className="btn-secondary w-full justify-center"><Download className="w-3.5 h-3.5"/>Install</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}