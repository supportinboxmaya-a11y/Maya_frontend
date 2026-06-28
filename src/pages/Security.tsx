import { useState } from 'react'
import { Shield, CheckCircle2, XCircle, Lock, FileSearch, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const riskTests = [
  {action:'web_search("latest AI news")',level:"low",allowed:true},
  {action:'read_file("data.csv")',level:"low",allowed:true},
  {action:'delete("important_file.txt")',level:"medium",allowed:true},
  {action:'run_shell("rm -rf /var")',level:"high",allowed:false},
  {action:'run_shell("sudo rm -rf /")',level:"critical",allowed:false},
]

const auditLogs = [
  {action:"Task executed",user:"admin",timestamp:"2 mins ago",risk:"low"},
  {action:"High-risk blocked: rm -rf",user:"system",timestamp:"1 hour ago",risk:"high"},
  {action:"Tool enabled: browser_open",user:"admin",timestamp:"3 hours ago",risk:"low"},
  {action:"Budget alert triggered",user:"system",timestamp:"5 hours ago",risk:"medium"},
]

const permissions = [
  {tool:"web_search",read:true,write:false,execute:true,delete:false},
  {tool:"read_file",read:true,write:false,execute:false,delete:false},
  {tool:"write_file",read:true,write:true,execute:false,delete:false},
  {tool:"run_code",read:true,write:true,execute:true,delete:false},
  {tool:"run_shell",read:true,write:true,execute:true,delete:true},
]

const levelColor: Record<string,string> = {low:"badge-green",medium:"badge-yellow",high:"badge-red",critical:"badge-red"}

export function Security() {
  const [testInput, setTestInput] = useState("")
  const [testResult, setTestResult] = useState<{level:string;allowed:boolean;reason:string}|null>(null)

  const runTest = () => {
    const lower = testInput.toLowerCase()
    const high = ["rm -rf","format","drop table","sudo rm","mkfs"]
    const med = ["delete","remove","kill","stop","disable"]
    if(high.some(k=>lower.includes(k))) setTestResult({level:"high",allowed:false,reason:"Dangerous keyword detected"})
    else if(med.some(k=>lower.includes(k))) setTestResult({level:"medium",allowed:true,reason:"Risky keyword — proceed with caution"})
    else setTestResult({level:"low",allowed:true,reason:"Safe action"})
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Center</h1>
        <p className="text-sm text-slate-400 mt-0.5">Risk management, permissions, and audit logs</p>
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
            <div className="space-y-2">
              {riskTests.map((t,i)=>(
                <div key={i} className="flex items-center gap-2 p-2 bg-[#1a1d2e] rounded-lg">
                  {t.allowed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0"/> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0"/>}
                  <span className="text-xs font-mono text-slate-400 flex-1 truncate">{t.action}</span>
                  <span className={cn("badge",levelColor[t.level])}>{t.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-blue-400"/>
            <h3 className="text-sm font-semibold text-white">Permission Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-slate-500 font-medium">Tool</th>
                  {["Read","Write","Execute","Delete"].map(h=><th key={h} className="text-center pb-2 text-slate-500 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {permissions.map(p=>(
                  <tr key={p.tool} className="border-t border-[#1e2130]/50">
                    <td className="py-2 font-mono text-white">{p.tool}</td>
                    {["read","write","execute","delete"].map(perm=>(
                      <td key={perm} className="py-2 text-center">
                        {(p as Record<string,boolean>)[perm]
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto"/>
                          : <XCircle className="w-3.5 h-3.5 text-slate-600 mx-auto opacity-30"/>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <FileSearch className="w-4 h-4 text-emerald-400"/>
            <h3 className="text-sm font-semibold text-white">Audit Logs</h3>
          </div>
          <div className="space-y-2">
            {auditLogs.map((log,i)=>(
              <div key={i} className="flex items-center gap-3 p-3 bg-[#1a1d2e] rounded-lg">
                <Clock className="w-4 h-4 text-slate-500 flex-shrink-0"/>
                <div className="flex-1">
                  <span className="text-sm text-white">{log.action}</span>
                  <span className="text-xs text-slate-500 ml-2">by {log.user}</span>
                </div>
                <span className={cn("badge",levelColor[log.risk])}>{log.risk}</span>
                <span className="text-xs text-slate-500">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}