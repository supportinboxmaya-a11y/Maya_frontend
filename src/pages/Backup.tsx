import { useState } from 'react'
import { ArchiveRestore, Plus, Download, RotateCcw, Trash2, Database, CheckCircle2 } from 'lucide-react'

const backups = [
  {id:1,name:"backup_2025-01-15_08-00",size:"2.4 MB",created:"2025-01-15T08:00:00Z",type:"auto",files:47},
  {id:2,name:"backup_2025-01-14_08-00",size:"2.3 MB",created:"2025-01-14T08:00:00Z",type:"auto",files:45},
  {id:3,name:"manual_before_update",size:"2.1 MB",created:"2025-01-13T15:30:00Z",type:"manual",files:43},
]

export function Backup() {
  const [creating, setCreating] = useState(false)
  const [restored, setRestored] = useState<number|null>(null)

  const create = async()=>{setCreating(true);await new Promise(r=>setTimeout(r,1500));setCreating(false)}
  const restore = async(id:number)=>{setRestored(id);await new Promise(r=>setTimeout(r,1000));setRestored(null)}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Backup & Restore</h1>
          <p className="text-sm text-slate-400 mt-0.5">{backups.length} backups available</p>
        </div>
        <button className="btn-primary" onClick={create} disabled={creating}>
          <Plus className="w-4 h-4"/>{creating?"Creating...":"Create Backup"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"Total Backups",value:backups.length,icon:Database},
          {label:"Total Size",value:"6.8 MB",icon:ArchiveRestore},
          {label:"Last Backup",value:"8 hours ago",icon:CheckCircle2},
        ].map(s=>(
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon className="w-5 h-5 text-purple-400"/>
            <div><div className="text-lg font-bold text-white">{s.value}</div><div className="text-xs text-slate-400">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {backups.map(b=>(
          <div key={b.id} className="card-hover p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-purple-400"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-white">{b.name}</span>
                  <span className={b.type==="manual"?"badge-purple":"badge-blue"}>{b.type}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{b.size} · {b.files} files · {new Date(b.created).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary text-xs py-1.5 px-3"><Download className="w-3.5 h-3.5"/>Export</button>
                <button className="btn-primary text-xs py-1.5 px-3" onClick={()=>restore(b.id)} disabled={restored===b.id}>
                  <RotateCcw className="w-3.5 h-3.5"/>{restored===b.id?"Restoring...":"Restore"}
                </button>
                <button className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}