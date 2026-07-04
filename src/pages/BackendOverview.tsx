import { useState, useEffect } from 'react'
import { StatusDot } from '@/components/ui/StatusDot'
import { Activity, Database, Zap, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { systemAPI, llmAPI } from '@/lib/api'

const services = [
  {name:"Planner",status:"online",latency:245,requests:34},
  {name:"Executor",status:"online",latency:180,requests:89},
  {name:"Verifier",status:"online",latency:310,requests:34},
  {name:"Memory Manager",status:"online",latency:45,requests:156},
  {name:"LLM Router",status:"online",latency:12,requests:201},
  {name:"Tool Registry",status:"online",latency:8,requests:312},
  {name:"Learning Engine",status:"online",latency:520,requests:12},
  {name:"Fallback Manager",status:"warning",latency:890,requests:5},
]

const queueData = [
  {time:"12:00",pending:2,running:1,done:8},
  {time:"12:05",pending:4,running:2,done:12},
  {time:"12:10",pending:1,running:3,done:15},
  {time:"12:15",pending:3,running:1,done:18},
  {time:"12:20",pending:0,running:2,done:20},
  {time:"12:25",pending:2,running:1,done:22},
]

export function BackendOverview() {
  const [uptime, setUptime] = useState(0)
  const [metrics, setMetrics] = useState<Record<string, unknown>|null>(null)
  const [flags, setFlags] = useState<Record<string, boolean>|null>(null)
  const [queue, setQueue] = useState<Record<string, unknown>|null>(null)
  const [llmStats, setLlmStats] = useState<Record<string, unknown>|null>(null)

  useEffect(()=>{
    setUptime(Math.floor(Math.random()*86400))
    const i = setInterval(()=>setUptime(u=>u+1),1000)
    return ()=>clearInterval(i)
  },[])

  useEffect(()=>{
    const load = async () => {
      const [m, f, q, l] = await Promise.allSettled([
        systemAPI.metrics(), systemAPI.flags(), systemAPI.queueStatus(), llmAPI.stats(),
      ])
      if (m.status==='fulfilled') setMetrics(m.value as any)
      if (f.status==='fulfilled') setFlags(f.value as any)
      if (q.status==='fulfilled') setQueue(q.value as any)
      if (l.status==='fulfilled') setLlmStats((l.value as any)?.stats || null)
    }
    load()
    const i = setInterval(load, 15000)
    return ()=>clearInterval(i)
  },[])

  const fmt = (s:number) => {
    const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60
    return `${h}h ${m}m ${sec}s`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Backend Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">Real-time system monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Uptime",value:fmt(uptime),icon:Clock,color:"text-emerald-400"},
          {label:"Total Requests",value:"1,247",icon:Activity,color:"text-purple-400"},
          {label:"Active Tasks",value:"3",icon:Zap,color:"text-blue-400"},
          {label:"Memory Usage",value:"234 MB",icon:Database,color:"text-yellow-400"},
        ].map(s=>(
          <div key={s.label} className="card p-5">
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`}/>
            <div className="text-xl font-bold text-white font-mono">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Service Health</h3>
          <div className="space-y-2">
            {services.map(s=>(
              <div key={s.name} className="flex items-center gap-3 p-2.5 bg-[#1a1d2e] rounded-lg">
                <StatusDot status={s.status==="online"?"online":"warning"}/>
                <span className="text-sm text-white flex-1">{s.name}</span>
                <span className="text-xs font-mono text-slate-500">{s.latency}ms</span>
                <span className="text-xs text-slate-500">{s.requests} req</span>
                <span className={`badge ${s.status==="online"?"badge-green":"badge-yellow"}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Task Queue (last 30 min)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={queueData}>
              <XAxis dataKey="time" tick={{fontSize:11,fill:"#64748b"}}/>
              <YAxis tick={{fontSize:11,fill:"#64748b"}}/>
              <Tooltip contentStyle={{background:"#14161e",border:"1px solid #1e2130",borderRadius:8,fontSize:12}}/>
              <Line type="monotone" dataKey="pending" stroke="#fbbf24" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="running" stroke="#38bdf8" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="done" stroke="#34d399" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block"/>Pending</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block"/>Running</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block"/>Done</span>
          </div>
        </div>
      </div>

      {/* Live backend data (Phase 1 + 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Feature Flags</h3>
          {!flags || Object.keys(flags).length===0 ? (
            <p className="text-xs text-slate-500">No flags reported by backend.</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(flags).map(([k,v])=>(
                <div key={k} className="flex items-center justify-between text-xs bg-[#1a1d2e] rounded-lg px-3 py-2">
                  <span className="text-slate-300 font-mono">{k}</span>
                  <span className={`badge ${v?"badge-green":"badge-yellow"}`}>{v?'on':'off'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Live Metrics</h3>
          {!metrics ? (
            <p className="text-xs text-slate-500">Metrics unavailable — backend Phase 1 layer may be offline.</p>
          ) : (
            <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-auto max-h-56">{JSON.stringify(metrics,null,2)}</pre>
          )}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">LLM Provider Stats</h3>
          {!llmStats || Object.keys(llmStats).length===0 ? (
            <p className="text-xs text-slate-500">No provider stats yet — stats populate after LLM calls.</p>
          ) : (
            <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-auto max-h-56">{JSON.stringify(llmStats,null,2)}</pre>
          )}
        </div>
      </div>

      {queue && Object.keys(queue).length>0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Live Queue Status</h3>
          <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-auto max-h-48">{JSON.stringify(queue,null,2)}</pre>
        </div>
      )}
    </div>
  )
}