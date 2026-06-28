import { mockCostSummary, mockAnalytics } from '@/lib/mock-data'
import { formatCost, formatTokens } from '@/lib/utils'
import { DollarSign, Zap, TrendingDown, RotateCcw, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ["#7c6af7","#38bdf8","#34d399","#fbbf24"]

export function Cost() {
  const s = mockCostSummary
  const pct = s.budget_used_pct
  const barColor = pct>=90?"#f87171":pct>=80?"#fbbf24":"#34d399"

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cost & Budget</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track and control LLM spending</p>
        </div>
        <button className="btn-secondary"><RotateCcw className="w-4 h-4"/>Reset Session</button>
      </div>

      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">Session Budget</div>
            <div className="text-3xl font-bold text-white font-mono">{formatCost(s.total_cost_usd)}</div>
            <div className="text-sm text-slate-400">of {formatCost(s.budget_usd)} limit</div>
          </div>
          <span className={`badge ${pct>=80?"badge-red":pct>=50?"badge-yellow":"badge-green"} text-sm px-3 py-1`}>{pct.toFixed(2)}% used</span>
        </div>
        <div className="h-3 bg-[#1a1d2e] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{width:`${Math.min(pct,100)}%`,background:barColor}}/>
        </div>
        {pct>=80 && <div className="flex items-center gap-2 mt-3 text-xs text-yellow-400"><AlertTriangle className="w-3.5 h-3.5"/>Budget alert: {pct.toFixed(1)}% used</div>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Total Calls",value:s.total_calls,icon:Zap,color:"text-purple-400"},
          {label:"Input Tokens",value:formatTokens(s.total_input_tokens),icon:TrendingDown,color:"text-blue-400"},
          {label:"Output Tokens",value:formatTokens(s.total_output_tokens),icon:TrendingDown,color:"text-emerald-400"},
          {label:"Total Tokens",value:formatTokens(s.total_tokens),icon:DollarSign,color:"text-yellow-400"},
        ].map(st=>(
          <div key={st.label} className="card p-4">
            <st.icon className={`w-4 h-4 mb-2 ${st.color}`}/>
            <div className="text-xl font-bold font-mono text-white">{st.value}</div>
            <div className="text-xs text-slate-400">{st.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Cost by Provider</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={Object.entries(s.by_provider).map(([k,v])=>({name:k,value:v.cost}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {Object.keys(s.by_provider).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(v:number)=>[formatCost(v),"Cost"]} contentStyle={{background:"#14161e",border:"1px solid #1e2130",borderRadius:8,fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {Object.entries(s.by_provider).map(([provider,data],i)=>(
                <div key={provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                    <span className="text-xs text-slate-400 capitalize">{provider}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-white">{formatCost(data.cost)}</div>
                    <div className="text-xs text-slate-500">{data.calls} calls</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Daily Cost (7 days)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={mockAnalytics.cost_over_time}>
              <XAxis dataKey="date" tick={{fontSize:11,fill:"#64748b"}} tickFormatter={v=>v.slice(5)}/>
              <YAxis tick={{fontSize:11,fill:"#64748b"}} tickFormatter={v=>`$${v}`}/>
              <Tooltip contentStyle={{background:"#14161e",border:"1px solid #1e2130",borderRadius:8,fontSize:12}} formatter={(v:number)=>[`$${v.toFixed(4)}`,"Cost"]}/>
              <Bar dataKey="cost" fill="#7c6af7" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}