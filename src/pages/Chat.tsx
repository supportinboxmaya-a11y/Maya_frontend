import { useState } from 'react'
import { useTaskStore } from '@/store'
import { Send, Loader2, ArrowLeft } from 'lucide-react'
import { StepItem } from '@/components/chat/StepItem'

export function Chat() {
  const { tasks, activeTaskId, setActiveTask } = useTaskStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const activeTask = tasks.find(t=>t.id===activeTaskId)
  const handleSubmit = async () => {
    if (!input.trim()) return
    setLoading(true)
    await new Promise(r=>setTimeout(r,1000))
    setLoading(false); setInput('')
  }
  return (
    <div className="h-[calc(100vh-8rem)]">
      {!activeTask ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Tasks</div>
          {tasks.slice(0,10).map(t=>(
            <div key={t.id} onClick={()=>setActiveTask(t.id)}
              className="p-4 rounded-xl border border-[#1e2130] hover:border-slate-600 cursor-pointer transition-all">
              <div className="text-sm text-white">{t.goal}</div>
              <span className={`mt-2 inline-block badge text-[10px] ${t.status==='done'?'badge-green':t.status==='failed'?'badge-red':t.status==='running'?'badge-blue':'badge-default'}`}>{t.status}</span>
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
              placeholder="Enter a goal for Maya..." className="input flex-1"/>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary px-4">
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <button onClick={()=>setActiveTask(null)} className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <ArrowLeft className="w-4 h-4"/> Back to tasks
          </button>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            <div className="card p-4"><div className="text-xs text-slate-500 mb-1">Goal</div><div className="text-sm text-white">{activeTask.goal}</div></div>
            {activeTask.steps.map((s,i)=><StepItem key={s.step} step={s} index={i}/>)}
          </div>
          <div className="flex gap-3">
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
              placeholder="Continue..." className="input flex-1"/>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary px-4">
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
