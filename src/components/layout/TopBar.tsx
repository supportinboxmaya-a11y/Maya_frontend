import { Bell, Search, Command } from 'lucide-react'
import { formatCost } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore, useCostStore, useUIStore } from '@/store'

export function TopBar() {
  const navigate = useNavigate()
  const { unreadCount } = useNotificationStore()
  const { costSummary } = useCostStore()
  const { setCommandPalette } = useUIStore()

  return <header className="h-14 border-b border-[#1e2130] bg-[#0f1117]/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-40">
    <button onClick={()=>setCommandPalette(true)} className="flex items-center gap-2 bg-[#14161e] border border-[#1e2130] rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:border-purple-500/30 transition-all w-48">
      <Search className="w-3.5 h-3.5"/><span>Search...</span>
      <span className="ml-auto flex items-center gap-0.5 text-xs"><Command className="w-3 h-3"/>K</span>
    </button>
    <div className="flex items-center gap-3">
      <div className="hidden md:flex items-center gap-2 bg-[#14161e] border border-[#1e2130] rounded-lg px-3 py-1.5">
        <div className="w-16 h-1.5 bg-[#1a1d2e] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{width:`${Math.min(costSummary.budget_used_pct,100)}%`}}/>
        </div>
        <span className="text-xs text-slate-500 font-mono">{formatCost(costSummary.total_cost_usd)} / {formatCost(costSummary.budget_usd)}</span>
      </div>
      <button onClick={()=>navigate('/notifications')} className="relative p-2 hover:bg-[#1a1d2e] rounded-lg transition-colors text-slate-400">
        <Bell className="w-4 h-4"/>
        {unreadCount>0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadCount}</span>}
      </button>
    </div>
  </header>
}