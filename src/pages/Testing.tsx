import { useState } from 'react'
import { TestTube, Play, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const initialTests = [
  {id:1,name:"Web Search Tool",description:'Test web_search with query "AI news"',status:"passed",duration:1240},
  {id:2,name:"Memory Store & Recall",description:"Store memory and retrieve via search",status:"passed",duration:450},
  {id:3,name:"Code Execution",description:"Run Python code and get output",status:"passed",duration:320},
  {id:4,name:"LLM Routing",description:"Route to best available provider",status:"failed",duration:890,error:"Provider timeout"},
  {id:5,name:"Risk Checker",description:"Block dangerous shell commands",status:"passed",duration:15},
  {id:6,name:"Workflow Engine",description:"Run 3-step test workflow",status:"pending",duration:0},
]

export function Testing() {
  const [tests, setTests] = useState(initialTests)
  const [running, setRunning] = useState(false)

  const runAll = async()=>{
    setRunning(true)
    setTests(prev=>prev.map(t=>({...t,status:"pending"})))
    for(let i=0;i<initialTests.length;i++){
      await new Promise(r=>setTimeout(r,600))
      setTests(prev=>prev.map((t,j)=>j===i?{...t,status:j===3?"failed":"passed"}:t))
    }
    setRunning(false)
  }

  const passed = tests.filter(t=>t.status==="passed").length
  const failed = tests.filter(t=>t.status==="failed").length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Testing Console</h1>
          <p className="text-sm text-slate-400 mt-0.5">{passed} passed · {failed} failed · {tests.length} total</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Plus className="w-4 h-4"/>Add Test</button>
          <button className="btn-primary" onClick={runAll} disabled={running}>
            <Play className="w-4 h-4"/>{running?"Running...":"Run All"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center"><div className="text-2xl font-bold text-emerald-400">{passed}</div><div className="text-xs text-slate-400">Passed</div></div>
        <div className="card p-4 text-center"><div className="text-2xl font-bold text-red-400">{failed}</div><div className="text-xs text-slate-400">Failed</div></div>
        <div className="card p-4 text-center"><div className="text-2xl font-bold text-white">{Math.round((passed/tests.length)*100)}%</div><div className="text-xs text-slate-400">Pass Rate</div></div>
      </div>

      <div className="space-y-2">
        {tests.map(t=>(
          <div key={t.id} className="card p-4">
            <div className="flex items-center gap-3">
              {t.status==="passed" && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0"/>}
              {t.status==="failed" && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0"/>}
              {t.status==="pending" && <Clock className={cn("w-5 h-5 text-slate-500 flex-shrink-0",running&&"animate-spin")}/>}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{t.name}</div>
                <div className="text-xs text-slate-500">{t.description}</div>
                {"error" in t && t.error && <div className="text-xs text-red-400 mt-0.5">{t.error}</div>}
              </div>
              {t.duration>0 && <span className="text-xs font-mono text-slate-500">{t.duration}ms</span>}
              <span className={cn("badge",t.status==="passed"?"badge-green":t.status==="failed"?"badge-red":"badge-default")}>{t.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}