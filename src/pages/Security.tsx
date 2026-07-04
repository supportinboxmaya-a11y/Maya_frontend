import { useEffect, useState } from 'react'
import { Shield, CheckCircle2, XCircle, Lock, FileSearch, Clock, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, adminAPI } from '@/lib/api'

const levelColor: Record<string,string> = {low:"badge-green",medium:"badge-yellow",high:"badge-red",critical:"badge-red"}

// Static risk POLICY reference (documentation of the sandbox rules, not live data)
const riskPolicy = [
  {action:'web_search / read_file',level:"low",allowed:true},
  {action:'write_file / delete file',level:"medium",allowed:true},
  {action:'run_shell (destructive)',level:"high",allowed:false},
  {action:'system-level destruction',level:"critical",allowed:false},
]

interface SecurityStatus { sandbox?: boolean; risk_level?: string; blocked_tools?: string[]; audit_log?: unknown[] }
interface AuditRow { actor?: string; action?: string; target?: string; ts?: string; [k: string]: unknown }

export function Security() {
  const [status, setStatus] = useState<SecurityStatus | null>(null)
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)

  const [testInput, setTestInput] = useState("")
  const [testResult, setTestResult] = useState<{level:string;allowed:boolean;reason:string}|null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [s, a] = await Promise.allSettled([
        api.get('/security/status'), adminAPI.audit(),
      ])
      if (s.status === 'fulfilled') setStatus(s.value as any)
      if (a.status === 'fulfilled') {
        const rows = (a.value as any)?.entries || (a.value as any)?.audit || (Array.isArray(a.value) ? a.value : [])
        setAudit(rows)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const runTest = () => {
    // Mirrors the backend sandbox keyword policy for instant local preview
    const lower = testInput.toLowerCase()
    const high = ["rm -rf","format","drop table","sudo rm","mkfs"]
    const med = ["delete","remove","kill","stop","disable"]
    if(high.some(k=>lower.includes(k))) setTestResult({level:"high",allowed:false,reason:"Dangerous keyword detected"})
    else if(med.some(k=>lower.includes(k))) setTestResult({level:"medium",allowed:true,reason:"Risky keyword — proceed with caution"})
    else setTestResult({level:"low",allowed:true,reason:"Safe action"})
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Center</h1>
          <p className="text-sm text-slate-400 mt-0.5">Live sandbox status, risk policy, and audit trail</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : (
        <>
          {/* Live status from backend */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:"Sandbox", value: status?.sandbox ? "Active" : "Off", ok: !!status?.sandbox},
              {label:"Risk Level", value: status?.risk_level || "unknown", ok: status?.risk_level === "low"},
              {label:"Blocked Tools", value: String(status?.blocked_tools?.length ?? 0), ok: true},
              {label:"Audit Entries", value: String(audit.length), ok: true},
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className={cn("text-xl font-bold font-mono", s.ok ? "text-emerald-400" : "text-yellow-400")}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-purple-400"/>
                <h3 className="text-sm font-semibold text-white">Risk Checker</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={testInput} onChange={e=>setTestInput(e.target.value)} placeholder="Test an action..." className="input text-sm" onKeyDown={e=>e.key==="Enter"&&runTest()}/>
                  <button onClick={runTest} className="btn-primary whitespace-nowrap">Test</button>
                </div>
                {testResult && (
                  <div className={cn("p-3 rounded-lg border text-sm",testResult.allowed?"bg-emerald-500/10 border-emerald-500/20":"bg-red-500/10 border-red-500/20")}>
                    <div className="flex items-center gap-2 mb-1">
                      {testResult.allowed ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : <XCircle className="w-4 h-4 text-red-400"/>}
                      <span className={testResult.allowed?"text-emerald-400":"text-red-400"}>{testResult.allowed?"Allowed":"Blocked"}</span>
                      <span className={cn("badge",levelColor[testResult.level])}>{testResult.level} risk</span>
                    </div>
                    <p className="text-xs text-slate-400">{testResult.reason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-blue-400"/>
                <h3 className="text-sm font-semibold text-white">Risk Policy Reference</h3>
              </div>
              <div className="space-y-2">
                {riskPolicy.map((t,i)=>(
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#1a1d2e] rounded-lg">
                    {t.allowed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0"/> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0"/>}
                    <span className="text-xs font-mono text-slate-400 flex-1 truncate">{t.action}</span>
                    <span className={cn("badge",levelColor[t.level])}>{t.level}</span>
                  </div>
                ))}
              </div>
              {status?.blocked_tools && status.blocked_tools.length > 0 && (
                <div className="mt-3 text-xs text-red-400">Blocked now: {status.blocked_tools.join(', ')}</div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileSearch className="w-4 h-4 text-emerald-400"/>
              <h3 className="text-sm font-semibold text-white">Audit Log (live)</h3>
            </div>
            {audit.length === 0 ? (
              <p className="text-xs text-slate-500">No audit entries yet. Admin actions (org/key changes) are recorded here.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {audit.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#1a1d2e] rounded-lg">
                    <Clock className="w-4 h-4 text-slate-500 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white">{log.action || JSON.stringify(log)}</span>
                      {log.actor && <span className="text-xs text-slate-500 ml-2">by {log.actor}</span>}
                      {log.target && <span className="text-xs text-slate-600 ml-2 font-mono">{log.target}</span>}
                    </div>
                    {log.ts && <span className="text-xs text-slate-500">{String(log.ts).slice(0,19).replace('T',' ')}</span>}
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
