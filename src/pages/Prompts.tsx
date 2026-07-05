import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BookOpenText, RefreshCw, Loader2 } from 'lucide-react'

export function Prompts() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try { setData(await api.get('/learning/prompts')) } catch { setData(null) }
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const opt = data?.optimizer || {}
  const tasks = Object.entries(opt)
  return (
    <div className="p-5 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2"><BookOpenText className="w-6 h-6 text-purple-400"/>Prompt Library</h1>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div> :
        tasks.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-[15px] text-slate-400">No prompt data yet.</p>
            <p className="text-sm text-slate-500 mt-1">Variants and win-rates appear as Maya learns from feedback.</p>
          </div>
        ) : tasks.map(([task, variants]) => (
          <div key={task} className="card p-4">
            <div className="text-[15px] font-semibold text-white mb-3">{task}</div>
            <pre className="text-sm text-slate-300 overflow-x-auto">{JSON.stringify(variants, null, 2)}</pre>
          </div>
        ))}
    </div>
  )
}
