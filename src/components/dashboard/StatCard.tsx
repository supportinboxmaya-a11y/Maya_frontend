import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  bg?: string
  badge?: string
  onClick?: () => void
}

export function StatCard({ label, value, icon: Icon, color, bg = "bg-[#1a1d2e]", badge, onClick }: StatCardProps) {
  return (
    <div className="card-hover p-5 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        {badge && <span className="badge-purple text-xs">{badge}</span>}
      </div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  )
}
