import { useState, useEffect } from 'react'
import { useTaskStore } from '@/store'
import { taskAPI } from '@/lib/api'
import { Send, Loader2, ArrowLeft } from 'lucide-react'
import { StepItem } from '@/components/chat/StepItem'
import toast from 'react-hot-toast'

function phaseLabel(phase?: string): string {
  switch (phase) {
    case 'planning': return 'Planning what to do...'
    case 'planned': return 'Plan ready, starting execution...'
    case 'step_start': return 'Running a step...'
    case 'step_done': return 'Step finished, continuing...'
    case 'verifying': return 'Double-checking the result...'
    default: return 'Maya is working on this...'
  }
}

export function Chat() {
  const { tasks, activeTaskId, setActiveTask, addTask, updateTask, setTasks } = useTaskStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    taskAPI.list({ limit: 20 }).then((data: any) => Array.isArray(data) && setTasks(data)).catch(() => {})
  }, [])
  const activeTask = tasks.find(t=>t.id===activeTaskId)

  const handleSubmit = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const task = await taskAPI.create(input.trim())
      addTask(task)
      setActiveTask(task.id)
      setInput('')
      const poll = setInterval(async () => {
        try {
          const updated = await taskAPI.get(task.id)
          updateTask(task.id, updated)
          if (updated.status === 'done' || updated.status === 'failed') {
            clearInterval(poll)
            setLoading(false)
          }
        } catch { clearInterval(poll); setLoading(false) }
      }, 2000)
    } catch {
      toast.error('Failed to create task')
      setLoading(false)
    }
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
            <div className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-slate-500">Goal</div>
                <span className={`badge text-[10px] ${activeTask.status==='done'?'badge-green':activeTask.status==='failed'?'badge-red':activeTask.status==='waiting_approval'?'badge-yellow':'badge-blue'}`}>
                  {activeTask.status === 'waiting_approval' ? 'waiting for approval' : activeTask.status}
                </span>
              </div>
              <div className="text-sm text-white">{activeTask.goal}</div>
            </div>

            {activeTask.status === 'waiting_approval' && (
              <div className="card p-4 border-amber-500/30 bg-amber-500/10">
                <div className="text-sm text-amber-400">⚠️ Maya needs your approval to continue.</div>
                <div className="text-xs text-slate-400 mt-1">Check the Approvals page to approve or reject this action.</div>
              </div>
            )}
            {(activeTask.status === 'running' || activeTask.status === 'pending') && activeTask.status !== 'waiting_approval' && (
              <div className="card p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400"/>
                <span className="text-sm text-slate-400">{phaseLabel((activeTask as any).current_phase)}</span>
              </div>
            )}

            {activeTask.steps?.map((s,i)=><StepItem key={s.step} step={s} index={i}/>)}

            {activeTask.status === 'done' && (
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">Result</div>
                <div className="text-sm text-white whitespace-pre-wrap">{activeTask.result || 'Task completed with no text result.'}</div>
              </div>
            )}
            {activeTask.status === 'failed' && (
              <div className="card p-4 border-red-500/30 bg-red-500/10">
                <div className="text-xs text-red-400 mb-1">Failed</div>
                <div className="text-sm text-red-300">{activeTask.error || activeTask.result || 'Task failed with no details.'}</div>
              </div>
            )}
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
