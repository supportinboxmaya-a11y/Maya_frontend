import { useEffect, useState } from 'react'
import { analyticsAPI } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Loader2 } from 'lucide-react'

export function Analytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsAPI.summary(), analyticsAPI.daily(7), analyticsAPI.tools()])
      .then(([summary, daily, tools]) => setData({ summary, daily, tools }))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
  if (!data) return <div className="text-center text-slate-500 mt-20">⚠️ Analytics unavailable — backend offline</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-bold text-white">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Total Tasks', value: data.summary?.total_tasks ?? 0},
          {label:'Success Rate', value: `${data.summary?.success_rate ?? 0}%`},
          {label:'Total Cost', value: `$${(data.summary?.total_cost_usd ?? 0).toFixed(4)}`},
          {label:'Avg Duration', value: `${data.summary?.avg_duration_ms ?? 0}ms`},
        ].map(s=>(
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className="text-xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>
      {data.daily?.length > 0 && (
        <div className="card p-4">
          <div className="text-sm font-semibold text-white mb-3">Daily Tasks (7d)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.daily}>
              <XAxis dataKey="date" tick={{fill:"#64748b", fontSize:11}}/>
              <YAxis tick={{fill:"#64748b", fontSize:11}}/>
              <Tooltip contentStyle={{background:"#14161e", border:"1px solid #1e2130"}}/>
              <Line type="monotone" dataKey="tasks" stroke="#a855f7" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
