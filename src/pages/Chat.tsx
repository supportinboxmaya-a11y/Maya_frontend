import { useState } from 'react'
import { useTaskStore } from '@/store'
import { Send, Loader2 } from 'lucide-react'
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
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-3">Recent Tasks</div>
        {tasks.slice(0,10).map(t=>(
          <div key={t.id} onClick={()=>setActiveTask(t.id)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${activeTaskId===t.id?'border-purple-500/40 bg-purple-500/5':'border-[#1e2130] hover:border-slate-600'}`}>
            <div className="text-xs text-white truncate">{t.goal}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4">
          {activeTask ? (
            <div className="space-y-3">
              <div className="card p-4"><div className="text-xs text-slate-500 mb-1">Goal</div><div className="text-sm text-white">{activeTask.goal}</div></div>
              {activeTask.steps.map(s=><StepItem key={s.step} step={s}/>)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">Select a task or start a new one</div>
          )}
        </div>
        <div className="flex gap-3">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} placeholder="Enter a goal for Maya..." className="input flex-1"/>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary px-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
          </button>
        </div>
      </div>
    </div>
  )
}
