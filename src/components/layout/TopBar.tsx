import { Bell, Command, Menu, ArrowLeft } from 'lucide-react'
import { formatCost } from '@/lib/utils'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotificationStore, useCostStore, useUIStore } from '@/store'

export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadCount } = useNotificationStore()
  const { costSummary } = useCostStore()
  const { setCommandPalette } = useUIStore()
  const isHome = location.pathname === '/' || location.pathname === ''

  // Deliberately always returns to Dashboard/home rather than doing a
  // history-based back (navigate(-1)). Sidebar navigation can build up an
  // unpredictable history stack (e.g. Chat -> Admin Panel -> Approvals), so
  // "back" going to whatever page happened to be visited previously felt
  // random. Always-to-home is simple and predictable regardless of the path
  // taken to get here.
  const goBack = () => {
    navigate('/')
  }

  return (
    <header className="h-16 border-b border-[#262b3f] bg-[#0f1117]/90 backdrop-blur flex items-center gap-3 px-3 md:px-6 sticky top-0 z-40">
      {!isHome && (
        <button onClick={goBack} aria-label="Go back"
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#14161e] border border-[#262b3f] text-slate-300 flex-shrink-0">
          <ArrowLeft className="w-5 h-5"/>
        </button>
      )}
      <button onClick={() => window.dispatchEvent(new Event('maya_open_sidebar'))}
        aria-label="Open menu"
        className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-[#14161e] border border-[#262b3f] text-slate-300 flex-shrink-0">
        <Menu className="w-5 h-5"/>
      </button>
      <button onClick={() => setCommandPalette(true)}
        className="flex items-center gap-2 bg-[#14161e] border border-[#262b3f] rounded-xl px-4 h-11 text-[15px] text-slate-400 hover:border-purple-400/40 transition-all flex-1 min-w-0">
        <Command className="w-4 h-4 flex-shrink-0"/>
        <span className="truncate">Search</span>
        <span className="ml-auto text-xs hidden md:inline">⌘K</span>
      </button>
      <div className="hidden md:flex items-center gap-2 bg-[#14161e] border border-[#262b3f] rounded-xl px-3 h-11 flex-shrink-0">
        <div className="w-16 h-2 bg-[#1a1d2e] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            style={{width: `${Math.min(costSummary.budget_used_pct, 100)}%`}}/>
        </div>
        <span className="text-xs text-slate-300 font-mono">
          {formatCost(costSummary.total_cost_usd)} / {formatCost(costSummary.budget_usd)}
        </span>
      </div>
      <button onClick={() => navigate('/notifications')} aria-label="Notifications"
        className="relative flex items-center justify-center w-11 h-11 rounded-xl hover:bg-[#1a1d2e] transition-colors text-slate-300 flex-shrink-0">
        <Bell className="w-5 h-5"/>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
    </header>
  )
}
