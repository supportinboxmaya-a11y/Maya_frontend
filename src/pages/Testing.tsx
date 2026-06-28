import { useState } from 'react'
import { agentAPI } from '@/lib/api'
import { Play, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function Testing() {
  const [input, setInput] = useState('')
  const [depth, setDepth] = useState('normal')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    if (!input.trim()) return
    setLoading(true); setResult(null)
    try {
      const res = await agentAPI.think(input, depth)
      setResult(res)
      toast.success('Test completed')
    } catch { toast.error('Test failed — backend offline') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-bold text-white">Testing Console</h1>
      <div className="card p-4 space-y-3">
        <textarea value={input} onChange={e => setInput(e.target.value)}
          placeholder="Enter a problem for Maya to think about..."
          rows={4} className="input w-full resize-none"/>
        <div className="flex items-center gap-3">
          <select value={depth} onChange={e => setDepth(e.target.value)}
            className="input w-36 text-xs">
            <option value="quick">Quick</option>
            <option value="normal">Normal</option>
            <option value="deep">Deep</option>
          </select>
          <button onClick={runTest} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
            Run Test
          </button>
        </div>
      </div>
      {result && (
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-2">Result</div>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
