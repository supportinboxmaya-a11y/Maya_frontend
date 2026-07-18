import { useState } from "react"
import { Sparkles, Paperclip, Languages, Globe, Check, Send } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Orb } from "@/components/maya/Orb"
import { Card, Skeleton } from "@/components/maya/ui"
import { NowCard } from "@/components/live/NowCard"
import { useLiveStore } from "@/store/live"
import { taskAPI, agentAPI } from "@/lib/api"
import { timeAgo } from "@/lib/utils"
import type { AgentTask } from "@/lib/agentLive"
import toast from "react-hot-toast"

const Q = [
  { icon: Sparkles, label: "New task", action: "Create a new task" },
  { icon: Paperclip, label: "Upload file", action: "I need to upload a file" },
  { icon: Languages, label: "Translate", action: "Translate this" },
  { icon: Globe, label: "Web search", action: "Search the web for" },
]

function TaskRow({ task, onClick }: { task: AgentTask; onClick: () => void }) {
  const liveTask = useLiveStore((s) => s.tasks[task.id])
  const t = liveTask || task
  const statusColor =
    t.status === "done" || t.status === "success" ? "#10B981" :
    t.status === "failed" ? "#EF4444" :
    t.status === "running" ? "var(--accent)" :
    "#64748B"
  return (
    <button onClick={onClick} className="w-full text-left m-focus m-press flex items-center gap-3 px-4 py-3 hover:bg-[var(--sunken)] transition-colors">
      <span className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: `${statusColor}18`, flexShrink: 0 }}>
        {t.status === "running" ? (
          <span className="m-spin" style={{ width: 12, height: 12, borderRadius: 999, border: "2px solid transparent", borderTopColor: statusColor }} />
        ) : (
          <Check size={14} style={{ color: statusColor }} />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium m-ink truncate">{t.goal || "Untitled"}</div>
        <div className="text-[12px] m-muted flex items-center gap-2">
          <span>{t.current_phase || t.status}</span>
          {t.cost_usd !== undefined && <span>· ${t.cost_usd.toFixed(4)}</span>}
        </div>
      </div>
      <span className="text-[11px] m-faint shrink-0">{timeAgo(t.id)}</span>
    </button>
  )
}

export function Home() {
  const navigate = useNavigate()
  const [quickInput, setQuickInput] = useState("")
  const currentTaskId = useLiveStore((s) => s.currentTaskId)
  const liveTasks = useLiveStore((s) => s.tasks)

  const { data: tasksData, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks", "recent"],
    queryFn: () => taskAPI.list({ limit: 10 }) as unknown as Promise<AgentTask[]>,
    staleTime: 15_000,
    retry: 2,
  })

  // Merge live tasks on top of fetched — live tasks supersede stale ones
  const recentTasks: AgentTask[] = tasksData
    ? tasksData.map((t) => liveTasks[t.id] || t)
    : Object.values(liveTasks).slice(0, 10)

  const handleQuickTask = async () => {
    const q = quickInput.trim()
    if (!q) return
    setQuickInput("")
    try {
      await agentAPI.run(q)
      navigate("/chat")
    } catch (e: any) {
      toast.error(e?.message || "Failed to start task")
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 m-rise">
      <NowCard />

      {/* Quick input — always visible */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 m-sunken m-bd rounded-2xl px-4 py-2.5">
          <Orb size={24} alive={!!currentTaskId} />
          <input
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuickTask() }}
            placeholder={currentTaskId ? "Task running — type to queue another…" : "What should Maya do?"}
            className="flex-1 bg-transparent outline-none text-[15px] m-ink placeholder:text-[var(--faint)]"
          />
          <button
            onClick={handleQuickTask}
            disabled={!quickInput.trim()}
            className="m-accent-bg rounded-xl p-2 m-press m-focus"
            style={{ opacity: quickInput.trim() ? 1 : 0.3 }}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 overflow-x-auto m-hide-sb">
          {Q.map((q) => (
            <button
              key={q.label}
              onClick={() => navigate("/chat")}
              className="flex items-center gap-1.5 m-sunken m-bd rounded-xl px-3 py-1.5 text-[12px] font-medium m-muted m-press m-focus whitespace-nowrap"
            >
              <q.icon size={13} className="m-accent" />
              <span>{q.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Recent tasks */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="m-display text-[15px] font-semibold m-ink">Recent tasks</h2>
        {(tasksData && tasksData.length > 0) && (
          <button onClick={() => navigate("/tasks")} className="text-[12px] font-medium m-accent m-press m-focus">See all</button>
        )}
      </div>

      {isLoading && (
        <Card><div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={48} />)}</div></Card>
      )}

      {error && !isLoading && (
        <Card>
          <div className="p-6 text-center">
            <div className="text-sm m-muted mb-3">Could not load recent tasks.</div>
            <button onClick={() => refetch()} className="m-accent-bg rounded-xl px-4 py-2 text-[13px] font-semibold m-press m-focus">Retry</button>
          </div>
        </Card>
      )}

      {!isLoading && !error && recentTasks.length === 0 && (
        <Card>
          <div className="p-8 text-center">
            <span className="m-accent-soft rounded-xl p-2.5 inline-flex mb-3"><Check size={18} className="m-accent" /></span>
            <div className="text-sm m-muted">No tasks yet. Tell Maya what to do above.</div>
          </div>
        </Card>
      )}

      {!isLoading && !error && recentTasks.length > 0 && (
        <Card className="divide-y divide-[var(--border)] overflow-hidden">
          {recentTasks.slice(0, 8).map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => navigate(`/tasks?task=${task.id}`)} />
          ))}
        </Card>
      )}
    </div>
  )
}
