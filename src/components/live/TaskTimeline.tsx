import { Check, X, Wrench } from "lucide-react"
import { stepStatus, type AgentTask } from "@/lib/agentLive"
import { Card } from "@/components/maya/ui"

function StepIcon({ step }: { step: AgentTask["steps"][number] }) {
  const s = stepStatus(step)
  if (s === "done") return <span className="rounded-full flex items-center justify-center" style={{ width: 22, height: 22, background: "rgba(16,185,129,.15)", flexShrink: 0 }}><Check size={13} style={{ color: "#10B981" }} /></span>
  if (s === "failed") return <span className="rounded-full flex items-center justify-center" style={{ width: 22, height: 22, background: "rgba(239,68,68,.16)", flexShrink: 0 }}><X size={13} style={{ color: "#EF4444" }} /></span>
  return <span className="m-spin" style={{ width: 22, height: 22, borderRadius: 999, border: "2px solid var(--border)", borderTopColor: "var(--accent)", flexShrink: 0 }} />
}

function ToolChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
      <Wrench size={11} />
      {name}
    </span>
  )
}

interface TaskTimelineProps {
  task: AgentTask
  admin?: boolean
}

export function TaskTimeline({ task, admin }: TaskTimelineProps) {
  const steps = task.steps || []

  if (steps.length === 0) {
    return (
      <Card>
        <div className="p-4 text-center text-sm m-muted">
          {task.status === "running" ? "Starting…" : "No steps recorded for this task."}
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-2 space-y-1">
        {steps.map((s, i) => {
          const st = stepStatus(s)
          return (
            <div key={i} className="flex gap-3 px-2 py-2.5 m-rise">
              <StepIcon step={s} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium m-ink">{s.title || s.description || `Step ${s.step ?? i + 1}`}</span>
                  {admin && s.tool && <ToolChip name={s.tool} />}
                </div>
                {s.description && s.title && (
                  <div className="text-[12px] m-muted mt-0.5">{s.description}</div>
                )}
                {admin && s.result && (
                  <div className="text-[12px] m-muted mt-0.5 m-mono truncate" style={{ whiteSpace: "pre-wrap" }}>
                    {String(s.result).slice(0, 240)}
                  </div>
                )}
                {s.error && (
                  <div className="text-[12px] mt-0.5" style={{ color: "#EF4444" }}>{s.error}</div>
                )}
              </div>
              {st !== "running" && (
                <span className="text-[11px] m-faint shrink-0">{st === "done" ? "OK" : "FAIL"}</span>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
