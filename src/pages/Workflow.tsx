import { useEffect, useState } from 'react'
import { workflowAPI } from '@/lib/api'
import { Loader2, Plus, Play, Trash2 } from 'lucide-react'
import type { Workflow } from '@/types'
import toast from 'react-hot-toast'

export function Workflow() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string|null>(null)

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const data = await workflowAPI.list()
      setWorkflows((data as any) || [])
    } catch { setWorkflows([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWorkflows() }, [])

  const runWorkflow = async (id: string) => {
    setRunning(id)
    try {
      await workflowAPI.run(id)
      toast.success('Workflow started!')
    } catch { toast.error('Failed to run workflow') }
    finally { setRunning(null) }
  }

  const deleteWorkflow = async (id: string) => {
    try {
      await workflowAPI.delete(id)
      setWorkflows(prev => prev.filter(w => w.id !== id))
      toast.success('Deleted')
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Workflow Builder</h1>
        <button className="btn-primary"><Plus className="w-4 h-4"/>New Workflow</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : workflows.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No workflows yet — create one!</div>
      ) : (
        <div className="space-y-3">
          {workflows.map(w => (
            <div key={w.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{w.name}</div>
                {w.description && <div className="text-xs text-slate-500 mt-0.5">{w.description}</div>}
                <div className="flex gap-3 mt-2 text-[10px] text-slate-600">
                  <span>Runs: {w.run_count}</span>
                  {w.last_run && <span>Last: {new Date(w.last_run).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => runWorkflow(w.id)} disabled={running === w.id}
                  className="btn-primary py-1.5 px-3 text-xs">
                  {running === w.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3"/>}
                  Run
                </button>
                <button onClick={() => deleteWorkflow(w.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
