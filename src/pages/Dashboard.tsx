import { useAgentStore, useTaskStore, useCostStore, useNotificationStore } from '@/store'
import { formatCost } from '@/lib/utils'
import { CheckCircle2, DollarSign, Bell, Zap } from 'lucide-react'
import { ProviderHealth } from '@/components/dashboard/ProviderHealth'
import { StatCard } from '@/components/dashboard/StatCard'

export function Dashboard() {
  const { status, currentGoal } = useAgentStore()
  const { tasks } = useTaskStore()
  const { costSummary } = useCostStore()
  const { unreadCount } = useNotificationStore()
  const done = tasks.filter(t=>t.status==='done').length
  const running = tasks.filter(t=>t.status==='running').length
  const failed = tasks.filter(t=>t.status==='failed').length
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Maya 2.0 ULTRA</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Agent Status" value={status} icon={Zap} color="text-purple-400"/>
        <StatCard label="Tasks Done" value={done} icon={CheckCircle2} color="text-emerald-400"/>
        <StatCard label="Total Cost" value={formatCost(costSummary.total_cost_usd)} icon={DollarSign} color="text-blue-400"/>
        <StatCard label="Notifications" value={unreadCount} icon={Bell} color="text-yellow-400"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Task Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Running</span><span className="text-sm font-bold font-mono text-blue-400">{running}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Completed</span><span className="text-sm font-bold font-mono text-emerald-400">{done}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Failed</span><span className="text-sm font-bold font-mono text-red-400">{failed}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Total</span><span className="text-sm font-bold font-mono text-white">{tasks.length}</span></div>
          </div>
        </div>
        <ProviderHealth/>
      </div>
    </div>
  )
}