import { useState } from "react"
import { XCircle, Wrench, Send, Eye } from "lucide-react"
import { Card } from "@/components/maya/ui"
import { useLiveStore } from "@/store/live"
import { queueAPI } from "@/lib/api"
import type { AgentTask } from "@/lib/agentLive"
import { formatCost } from "@/lib/utils"
import toast from "react-hot-toast"

function TaskRow({ task }: { task: AgentTask }) {
  const [cancelling, setCancelling] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [queuedTask, setQueuedTask] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const cancelTask = useLiveStore((s) => s.cancelTask)
  const lastStep = task.steps?.[task.steps.length - 1]

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelTask(task.id)
      toast.success("Task cancelled")
    } catch {
      toast.error("Cancel failed")
    }
    setCancelling(false)
  }

  const handleShowDetail = async () => {
    if (showDetail) { setShowDetail(false); return }
    setDetailLoading(true)
    try {
      const res: any = await queueAPI.task(task.id)
      setQueuedTask(res)
      setShowDetail(true)
    } catch {
      toast.error("Could not load queue detail")
    }
    setDetailLoading(false)
  }

  return (
    <div className="px-4 py-3 hover:bg-[var(--sunken)] transition-colors rounded-xl">
      <div className="flex items-start gap-3">
        <span className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: "var(--accent-soft)", flexShrink: 0 }}>
          {task.status === "running" ? (
            <span className="m-spin" style={{ width: 12, height: 12, borderRadius: 999, border: "2px solid var(--border)", borderTopColor: "var(--accent)", display: "block" }} />
          ) : task.status === "done" || task.status === "success" ? (
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#10B981", display: "block" }} />
          ) : (
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#EF4444", display: "block" }} />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium m-ink truncate">{task.goal}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[12px] m-muted">
            <span>{task.current_phase || task.status}</span>
            {lastStep?.tool && (
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <Wrench size={10} />{lastStep.tool}
              </span>
            )}
            {task.steps && <span>step {task.steps.length}</span>}
            {typeof task.cost_usd === "number" && <span>{formatCost(task.cost_usd)}</span>}
            {task.provider_used && <span>· {task.provider_used}</span>}
          </div>
          {lastStep?.result && (
            <div className="text-[12px] m-muted mt-1 m-mono truncate">{String(lastStep.result).slice(0, 160)}</div>
          )}
          {lastStep?.error && (
            <div className="text-[12px] mt-1" style={{ color: "#EF4444" }}>{lastStep.error}</div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleShowDetail}
            disabled={detailLoading}
            className="m-press m-focus rounded-xl p-1.5 m-muted"
            title="Queue detail"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling || task.status !== "running"}
            className="m-press m-focus rounded-xl px-2.5 py-1.5 text-[12px] font-medium flex items-center gap-1"
            style={{ color: "#EF4444", background: "rgba(239,68,68,.08)", opacity: task.status === "running" ? 1 : 0.3 }}
          >
            <XCircle size={13} />
            {cancelling ? "…" : "Cancel"}
          </button>
        </div>
      </div>

      {/* Queue detail modal */}
      {showDetail && queuedTask && (
        <div className="mt-2 m-sunken m-bd rounded-xl p-3 text-[12px]">
          <pre className="m-mono m-muted whitespace-pre-wrap max-h-48 overflow-auto">{JSON.stringify(queuedTask, null, 2)}</pre>
          <button onClick={() => setShowDetail(false)} className="text-[11px] m-accent mt-1 m-press m-focus">Close</button>
        </div>
      )}
    </div>
  )
}

export function LivePanel() {
  const tasks = useLiveStore((s) => s.tasks)
  const connected = useLiveStore((s) => s.connected)
  const runningTasks = Object.values(tasks).filter((t) => t.status === "running")
  const recentTasks = Object.values(tasks).slice(0, 20)

  // Queue submit
  const [goal, setGoal] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const handleSubmit = async () => {
    const g = goal.trim()
    if (!g) return
    setSubmitting(true)
    try {
      await queueAPI.submit(g)
      toast.success("Task queued")
      setGoal("")
    } catch {
      toast.error("Failed to submit to queue")
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <Card className="p-4 flex items-center gap-3">
        <span
          className="rounded-full"
          style={{ width: 10, height: 10, background: connected ? "#10B981" : "#EF4444", flexShrink: 0 }}
        />
        <span className="text-sm m-ink">
          {connected ? "Live — connected" : "Disconnected — showing cached data"}
        </span>
      </Card>

      {/* Submit to queue */}
      <Card className="p-4">
        <h3 className="text-[15px] font-semibold m-ink mb-3">Submit Queued Task</h3>
        <div className="flex items-center gap-2">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
            placeholder="Task goal to queue…"
            className="flex-1 m-sunken m-bd rounded-xl px-3 py-2 text-[13px] m-ink outline-none placeholder:text-[var(--faint)]"
          />
          <button
            onClick={handleSubmit}
            disabled={!goal.trim() || submitting}
            className="m-accent-bg rounded-xl px-3 py-2 text-[13px] font-medium m-press m-focus flex items-center gap-1.5"
          >
            <Send size={14} />
            {submitting ? "…" : "Submit"}
          </button>
        </div>
      </Card>

      {/* Running tasks */}
      <div>
        <h3 className="text-[15px] font-semibold m-ink mb-3">Running ({runningTasks.length})</h3>
        {runningTasks.length === 0 ? (
          <Card><div className="p-6 text-center text-sm m-muted">No tasks running right now.</div></Card>
        ) : (
          <Card className="divide-y divide-[var(--border)] overflow-hidden">
            {runningTasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </Card>
        )}
      </div>

      {/* Recent tasks */}
      <div>
        <h3 className="text-[15px] font-semibold m-ink mb-3">Recent ({recentTasks.length})</h3>
        <Card className="divide-y divide-[var(--border)] overflow-hidden">
          {recentTasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </Card>
      </div>
    </div>
  )
}
