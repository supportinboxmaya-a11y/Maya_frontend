import { useEffect, useState } from 'react'
import { toolAPI } from '@/lib/api'
import { Loader2, RefreshCw } from 'lucide-react'
import type { Tool } from '@/types'
import toast from 'react-hot-toast'

export function Tools() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTools = async () => {
    setLoading(true)
    try {
      const data = await toolAPI.list()
      setTools((data as any) || [])
    } catch { setTools([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTools() }, [])

  const toggle = async (tool: Tool) => {
    try {
      await toolAPI.update(tool.name, !tool.enabled)
      setTools(prev => prev.map(t => t.name === tool.name ? {...t, enabled: !t.enabled} : t))
      toast.success(`${tool.name} ${!tool.enabled ? 'enabled' : 'disabled'}`)
    } catch { toast.error('Failed to update tool') }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Tool Manager</h1>
        <button onClick={fetchTools} className="btn-secondary"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : tools.length === 0 ? (
        <div className="text-center text-slate-500 py-20">⚠️ No tools found — backend offline</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map(tool => (
            <div key={tool.name} className="card p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{tool.name}</span>
                  <span className="badge badge-default text-[10px]">{tool.category}</span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{tool.description}</div>
                <div className="flex gap-3 text-[10px] text-slate-600">
                  <span>Calls: {tool.call_count}</span>
                  <span>Success: {tool.success_rate}%</span>
                  <span>Avg: {tool.avg_duration_ms}ms</span>
                </div>
              </div>
              <button onClick={() => toggle(tool)}
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-1 ${tool.enabled ? 'bg-purple-500' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${tool.enabled ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
