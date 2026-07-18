import { useLiveStore, type FeedEvent } from "@/store/live"
import { Check, X, Clock, Activity as ActivityIcon } from "lucide-react"
import { Card } from "@/components/maya/ui"
import { StatusDot } from "@/components/ui/StatusDot"

function FeedIcon({ e }: { e: FeedEvent }) {
  if (e.type === "task_done") {
    return e.success !== false
      ? <span className="rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "rgba(16,185,129,.15)", flexShrink: 0 }}><Check size={14} style={{ color: "#10B981" }} /></span>
      : <span className="rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "rgba(239,68,68,.16)", flexShrink: 0 }}><X size={14} style={{ color: "#EF4444" }} /></span>
  }
  if (e.type === "task_progress") {
    return <span className="m-spin" style={{ width: 24, height: 24, borderRadius: 999, border: "2px solid var(--border)", borderTopColor: "var(--accent)", flexShrink: 0 }} />
  }
  // task_started
  return <span className="rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "rgba(99,102,241,.12)", flexShrink: 0 }}><ActivityIcon size={14} style={{ color: "var(--accent)" }} /></span>
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function EventRow({ e }: { e: FeedEvent }) {
  const statusLabel =
    e.type === "task_done"
      ? e.success !== false ? "Done" : "Failed"
      : e.type === "task_started" ? "Started" : ""
  return (
    <div className="flex items-start gap-3 py-2 px-2 rounded-xl transition-colors hover:bg-[var(--sunken)]">
      <FeedIcon e={e} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium m-ink truncate">{e.goal}</span>
          {statusLabel && (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{
              background: e.success !== false ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)",
              color: e.success !== false ? "#10B981" : "#EF4444",
            }}>{statusLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px] m-muted mt-0.5">
          <Clock size={11} />
          <span>{formatTime(e.ts)}</span>
          {e.phase && <><span>·</span><span>{e.phase}</span></>}
        </div>
      </div>
    </div>
  )
}

export function LiveActivity() {
  const feed = useLiveStore((s) => s.feed)
  const connected = useLiveStore((s) => s.connected)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 m-rise">
      <div className="flex items-center gap-3 mb-6">
        <span className="m-accent-soft rounded-xl p-2.5 inline-flex"><ActivityIcon size={20} className="m-accent" /></span>
        <h1 className="m-display text-2xl font-semibold m-ink">Activity</h1>
        <StatusDot status={connected ? "online" : "offline"} />
      </div>

      {feed.length === 0 && (
        <Card>
          <div className="p-8 text-center">
            <span className="m-accent-soft rounded-xl p-2.5 inline-flex mb-3"><ActivityIcon size={18} className="m-accent" /></span>
            <div className="text-sm m-muted">No activity yet. Start a task to see live progress.</div>
          </div>
        </Card>
      )}

      {feed.length > 0 && (
        <Card className="divide-y divide-[var(--border)]">
          {feed.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </Card>
      )}
    </div>
  )
}
