import { cn } from "@/lib/utils"
import { truncate } from "@/lib/utils"
import type { Step } from "@/types"

export function StepItem({ step, index }: { step: Step; index: number }) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
          step.success===true ? "bg-emerald-500/20 text-emerald-400" :
          step.success===false ? "bg-red-500/20 text-red-400" :
          "bg-blue-500/20 text-blue-400 animate-pulse"
        )}>
          {step.success===true ? "✓" : step.success===false ? "✗" : index+1}
        </div>
        <div className="w-px flex-1 bg-[#1e2130] mt-1"/>
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-white">{step.title}</span>
          {step.tool && <span className="badge-purple font-mono text-[10px]">{step.tool}</span>}
          {step.duration_ms && <span className="text-xs text-slate-500">{step.duration_ms}ms</span>}
        </div>
        <div className="text-xs text-slate-400 mb-2">{step.description}</div>
        {step.result && (
          <div className="bg-[#0a0b0f] border border-[#1e2130] rounded-lg p-3 text-xs text-slate-400 font-mono">
            {truncate(step.result, 200)}
          </div>
        )}
        {step.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
            {step.error}
          </div>
        )}
      </div>
    </div>
  )
}