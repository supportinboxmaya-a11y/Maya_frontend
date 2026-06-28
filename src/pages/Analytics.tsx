import { mockAnalytics } from '@/lib/mock-data'
import { formatCost, formatTokens } from '@/lib/utils'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, Cpu, CheckCircle2 } from 'lucide-react'

const COLORS = ["#7c6af7","#38bdf8","#34d399","#fbbf24","#f87171","#fb923c"]

export function Analytics() {
  const a = mockAnalytics
  const avgRate = Math.round(a.success_rate_trend.reduce((s,d)=>s+d.rate,0)/a.success_rate_trend.length)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">Performance insights and usage statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Total Tasks",value:a.total_tasks_all_time,icon:CheckCircle2,color:"text-emerald-400",sub:`${a.avg_steps_per_task} avg steps`},
          {label:"Total Cost",value:formatCost(a.total_cost_all_time),icon:DollarSign,color:"text-blue-400",sub:"all time"},
          {label:"Top Tool",value:a.tool_usage[0]?.tool||"-",icon:Cpu,color:"text-purple-400",sub:`${a.tool_usage[0]?.count} calls`},
          {label:"Avg Success",value:`${avgRate}%`,icon:TrendingUp,color:"text-yellow-400",sub:"7 day avg"},
        ].map(s=>(
          <div key={s.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#1a1d2e] flex items-center justify-center">
                <s.icon className={`w-4 h-4 ${s.color}`}/>
              </div>
              <span className="badge-default text-xs">{s.sub}</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Daily Task Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={a.daily_tasks}>
              <XAxis dataKey="date" tick={{fontSize:11,fill:"#64748b"}} tickFormatter={v=>v.slice(5)}/>
              <YAxis tick={{fontSize:11,fill:"#64748b"}}/>
              <Tooltip contentStyle={{background:"#14161e",border:"1px solid #1e2130",borderRadius:8,fontSize:12}}/>
              <Bar dataKey="success" fill="#34d399" radius={[4,4,0,0]}/>
              <Bar dataKey="failed" fill="#f87171" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Cost Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={a.cost_over_time}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fontSize:11,fill:"#64748b"}} tickFormatter={v=>v.slice(5)}/>
              <YAxis tick={{fontSize:11,fill:"#64748b"}} tickFormatter={v=>`$${v}`}/>
              <Tooltip contentStyle={{background:"#14161e",border:"1px solid #1e2130",borderRadius:8,fontSize:12}} formatter={(v:number)=>[`$${v.toFixed(4)}`,"Cost"]}/>
              <Area type="monotone" dataKey="cost" stroke="#38bdf8" fill="url(#gc)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Provider Usage</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={a.provider_usage} dataKey="calls" nameKey="provider" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {a.provider_usage.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:"#14161e",border:"1px solid #1e2130",borderRadius:8,fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {a.provider_usage.map((p,i)=>(
                <div key={p.provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                    <span className="text-xs text-slate-400 capitalize">{p.provider}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-white">{p.calls} calls</div>
                    <div className="text-xs text-slate-500">${p.cost.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Tool Usage</h3>
          <div className="space-y-3">
            {a.tool_usage.map((t,i)=>(
              <div key={t.tool} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4">{i+1}</span>
                <span className="text-xs font-mono text-white w-28 truncate">{t.tool}</span>
                <div className="flex-1 h-2 bg-[#1a1d2e] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${(t.count/a.tool_usage[0].count)*100}%`,background:COLORS[i%COLORS.length]}}/>
                </div>
                <span className="text-xs text-slate-500 w-14 text-right">{t.count} calls</span>
                <span className="text-xs text-emerald-400 w-10 text-right">{t.success_rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}