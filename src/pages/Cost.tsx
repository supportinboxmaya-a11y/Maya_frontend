import { useEffect, useState } from 'react'
import { analyticsAPI } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'
import { formatCost } from '@/lib/utils'

export function Cost() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsAPI.summary(), analyticsAPI.providers()])
      .then(([summary, providers]) => setData({ summary, providers }))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
  if (!data) return <div className="text-center text-slate-500 mt-20">⚠️ Cost data unavailable — backend offline</div>

  const s = data.summary || {}
  const pct = Math.min(s.budget_used_pct || 0, 100)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-bold text-white">Cost & Budget</h1>
      <div className="card p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Budget Used</span>
          <span className="text-white font-mono">{formatCost(s.total_cost_usd || 0)} / {formatCost(s.budget_usd || 1)}</span>
        </div>
        <div className="h-2 bg-[#1a1d2e] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all" style={{width:`${pct}%`}}/>
        </div>
        <div className="text-xs text-slate-500">{pct.toFixed(1)}% used</div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Total Calls', value: s.total_calls ?? 0},
          {label:'Total Tokens', value: `${((s.total_tokens||0)/1000).toFixed(1)}k`},
          {label:'Total Cost', value: formatCost(s.total_cost_usd || 0)},
        ].map(c=>(
          <div key={c.label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1">{c.label}</div>
            <div className="text-lg font-bold text-white">{c.value}</div>
          </div>
        ))}
      </div>
      {data.providers && Object.keys(data.providers).length > 0 && (
        <div className="card p-4">
          <div className="text-sm font-semibold text-white mb-3">Cost by Provider</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={Object.entries(data.providers).map(([k,v]:any)=>({name:k,...v}))}>
              <XAxis dataKey="name" tick={{fill:"#64748b", fontSize:11}}/>
              <YAxis tick={{fill:"#64748b", fontSize:11}}/>
              <Tooltip contentStyle={{background:"#14161e", border:"1px solid #1e2130"}}/>
              <Bar dataKey="cost" fill="#a855f7" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
