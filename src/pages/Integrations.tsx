import { useState } from 'react'
import { Globe, Plus, Webhook, Key, CheckCircle2, XCircle } from 'lucide-react'

const apps = [
  {id:1,name:"GitHub",description:"Code repositories and PR automation",connected:true,category:"Developer"},
  {id:2,name:"Slack",description:"Team messaging and notifications",connected:false,category:"Communication"},
  {id:3,name:"Notion",description:"Notes and database management",connected:true,category:"Productivity"},
  {id:4,name:"Google Drive",description:"File storage and documents",connected:false,category:"Storage"},
  {id:5,name:"Zapier",description:"Workflow automation",connected:false,category:"Automation"},
  {id:6,name:"Discord",description:"Community and notifications",connected:false,category:"Communication"},
]

const webhooks = [
  {id:1,name:"Task Complete Webhook",url:"https://hooks.example.com/maya/done",events:["task.done"],active:true},
  {id:2,name:"Error Alert",url:"https://hooks.example.com/maya/error",events:["task.failed","budget.alert"],active:true},
]

export function Integrations() {
  const [integrations, setIntegrations] = useState(apps)
  const toggle = (id:number) => setIntegrations(prev=>prev.map(a=>a.id===id?{...a,connected:!a.connected}:a))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Integrations</h1>
          <p className="text-sm text-slate-400 mt-0.5">{integrations.filter(a=>a.connected).length} connected</p>
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4"/>Add Integration</button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">App Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map(app=>(
            <div key={app.id} className="card-hover p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a1d2e] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-slate-500"/>
                </div>
                {app.connected ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : <XCircle className="w-4 h-4 text-slate-600 opacity-30"/>}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{app.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{app.description}</p>
              <div className="flex items-center justify-between">
                <span className="badge-default">{app.category}</span>
                <button onClick={()=>toggle(app.id)} className={app.connected?"bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-lg transition-all":"btn-secondary text-xs py-1.5 px-3"}>
                  {app.connected?"Disconnect":"Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Webhooks</h2>
          <button className="btn-secondary text-xs py-1.5 px-3"><Plus className="w-3.5 h-3.5"/>Add Webhook</button>
        </div>
        <div className="space-y-3">
          {webhooks.map(w=>(
            <div key={w.id} className="card-hover p-4">
              <div className="flex items-start gap-3">
                <Webhook className="w-4 h-4 text-purple-400 mt-0.5"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{w.name}</span>
                    <span className={w.active?"badge-green":"badge-default"}>{w.active?"Active":"Inactive"}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 truncate">{w.url}</div>
                  <div className="flex gap-1 mt-2">{w.events.map(e=><span key={e} className="badge-purple font-mono text-[10px]">{e}</span>)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">API Keys</h2>
          <button className="btn-secondary text-xs py-1.5 px-3"><Key className="w-3.5 h-3.5"/>Generate Key</button>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4 text-yellow-400"/>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Production API Key</div>
              <div className="text-xs font-mono text-slate-500">maya_sk_••••••••••••••••••••••••1234</div>
            </div>
            <span className="badge-green">Active</span>
            <button className="btn-secondary text-xs py-1.5 px-3">Copy</button>
          </div>
        </div>
      </div>
    </div>
  )
}