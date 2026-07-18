import { useEffect, useState } from "react"
import { XCircle, Clock, Zap, Wrench } from "lucide-react"
import { useLiveStore } from "@/store/live"
import { Card } from "@/components/maya/ui"
import { Orb } from "@/components/maya/Orb"
import toast from "react-hot-toast"

function useElapsed(startedAt: number | null): string {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  if (startedAt === null) return ""
  const diff = (startedAt !== null ? now - startedAt : 0)
  const s = Math.floor(diff / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

export function NowCard() {
  const tasks = useLiveStore((s) => s.tasks)
  const currentTaskId = useLiveStore((s) => s.currentTaskId)
  const currentTaskStartedAt = useLiveStore((s) => s.currentTaskStartedAt)
  const cancelTask = useLiveStore((s) => s.cancelTask)
  const [cancelling, setCancelling] = useState(false)
  const elapsed = useElapsed(currentTaskStartedAt)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const task = currentTaskId ? tasks[currentTaskId] : null

  if (!task) {
    return (
      <Card className="p-5 md:p-6 mb-6">
        <div className="flex items-center gap-4">
          <Orb size={52} />
          <div className="flex-1 min-w-0">
            <div className="m-display text-lg font-semibold m-ink">Idle</div>
            <div className="text-sm m-muted">Maya is ready. Start a task to see progress here.</div>
          </div>
        </div>
      </Card>
    )
  }

  const lastStep = task.steps?.[task.steps.length - 1]

  const handleCancel = async () => {
    setCancelling(true)
    await cancelTask(task.id)
    toast.success("Task cancelled")
    setCancelling(false)
  }

  return (
    <Card className={`p-5 md:p-6 mb-6 ${mounted ? "m-rise" : ""}`}>
      <div className="flex items-center gap-4">
        <Orb size={52} alive />
        <div className="flex-1 min-w-0">
          <div className="m-display text-lg font-semibold m-ink truncate">
            Running: {task.goal}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-sm m-muted">
            {task.current_phase && (
              <span className="inline-flex items-center gap-1">
                <Wrench size={13} />
                {task.current_phase}
              </span>
            )}
            {lastStep?.tool && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <Wrench size={11} />
                {lastStep.tool}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock size={13} className="m-accent" />
              {elapsed}
            </span>
            {typeof task.cost_usd === "number" && (
              <span className="inline-flex items-center gap-1">
                <Zap size={13} className="m-accent" />
                ${task.cost_usd.toFixed(4)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="m-press m-focus rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-1.5"
          style={{ color: "#EF4444", background: "rgba(239,68,68,.08)" }}
        >
          <XCircle size={16} />
          {cancelling ? "…" : "Cancel"}
        </button>
      </div>
    </Card>
  )
}
