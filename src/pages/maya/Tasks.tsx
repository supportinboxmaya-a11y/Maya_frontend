import { ListTodo, Check, X, ArrowLeft, Trash2, RefreshCw } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, Skeleton } from "@/components/maya/ui"
import { StatusDot } from "@/components/ui/StatusDot"
import { TaskTimeline } from "@/components/live/TaskTimeline"
import { useLiveStore } from "@/store/live"
import { useRole } from "@/hooks/useRole"
import { taskAPI } from "@/lib/api"
import { timeAgo, formatCost } from "@/lib/utils"
import type { AgentTask } from "@/lib/agentLive"
import toast from "react-hot-toast"

function TaskStatusIcon({ status }: { status: string }) {
  const done = status === "done" || status === "success"
  const failed = status === "failed"
  if (done) return <Check size={16} style={{ color: "#10B981" }} />
  if (failed) return <X size={16} style={{ color: "#EF4444" }} />
  if (status === "running") return <span className="m-spin" style={{ width: 14, height: 14, borderRadius: 999, border: "2px solid var(--border)", borderTopColor: "var(--accent)", display: "block" }} />
  return <span style={{ width: 14, height: 14, borderRadius: 999, background: "var(--faint)", display: "block" }} />
}

export function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const liveTasks = useLiveStore((s) => s.tasks)
  const { isAdmin } = useRole()
  const selectedId = searchParams.get("task")

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskAPI.list({ limit: 50 }) as unknown as Promise<AgentTask[]>,
    staleTime: 10_000,
    retry: 2,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Task deleted")
    },
    onError: () => toast.error("Failed to delete task"),
  })

  const tasks: AgentTask[] = data ? data.map((t) => liveTasks[t.id] || t) : Object.values(liveTasks)
  const selected = selectedId ? tasks.find((t) => t.id === selectedId) || liveTasks[selectedId] : null

  // If a task is selected, show detail
  if (selected) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 m-rise">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSearchParams({})} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="m-display text-lg font-semibold m-ink truncate">{selected.goal || "Task"}</h1>
            <div className="text-[12px] m-muted flex items-center gap-2">
              <StatusDot status={selected.status === "running" ? "online" : selected.status === "failed" ? "error" : "offline"} />
              <span>{selected.status}</span>
              {selected.current_phase && <><span>·</span><span>{selected.current_phase}</span></>}
              {isAdmin && selected.provider_used && <><span>·</span><span>{selected.provider_used}</span></>}
              {isAdmin && typeof selected.cost_usd === "number" && <><span>·</span><span>{formatCost(selected.cost_usd)}</span></>}
              {isAdmin && typeof selected.tokens_used === "number" && <><span>·</span><span>{selected.tokens_used.toLocaleString()} tokens</span></>}
            </div>
          </div>
          <button
            onClick={() => { deleteMutation.mutate(selected.id); setSearchParams({}) }}
            className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"
            style={{ color: "#EF4444" }}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {selected.error && (
          <div className="m-card mb-4 p-4" style={{ borderColor: "rgba(239,68,68,.3)" }}>
            <div className="text-[13px]" style={{ color: "#EF4444" }}>{selected.error}</div>
          </div>
        )}

        <TaskTimeline task={selected} admin={isAdmin} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 m-rise">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="m-accent-soft rounded-xl p-2.5 inline-flex"><ListTodo size={20} className="m-accent" /></span>
          <h1 className="m-display text-2xl font-semibold m-ink">Tasks</h1>
        </div>
        {!isLoading && !error && (
          <button onClick={() => refetch()} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]">
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      {isLoading && (
        <Card><div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={52} />)}</div></Card>
      )}

      {error && !isLoading && (
        <Card>
          <div className="p-8 text-center">
            <div className="text-sm m-muted mb-3">Failed to load tasks. Check your connection.</div>
            <button onClick={() => refetch()} className="m-accent-bg rounded-xl px-4 py-2 text-[13px] font-semibold m-press m-focus">Retry</button>
          </div>
        </Card>
      )}

      {!isLoading && !error && tasks.length === 0 && (
        <Card>
          <div className="p-8 text-center">
            <span className="m-accent-soft rounded-xl p-2.5 inline-flex mb-3"><ListTodo size={18} className="m-accent" /></span>
            <div className="text-sm m-muted mb-1">No tasks yet.</div>
            <div className="text-[13px] m-muted">Go to <button onClick={() => navigate("/")} className="m-accent underline">Home</button> or <button onClick={() => navigate("/chat")} className="m-accent underline">Ask</button> to start one.</div>
          </div>
        </Card>
      )}

      {!isLoading && !error && tasks.length > 0 && (
        <Card className="divide-y divide-[var(--border)] overflow-hidden">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSearchParams({ task: task.id })}
              className="w-full text-left m-focus m-press flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--sunken)] transition-colors"
            >
              <span className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, background: "var(--accent-soft)", flexShrink: 0 }}>
                <TaskStatusIcon status={task.status} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium m-ink truncate">{task.goal || "Untitled"}</div>
                <div className="flex items-center gap-2 text-[12px] m-muted mt-0.5">
                  <span>{task.status}</span>
                  {task.current_phase && <><span>·</span><span>{task.current_phase}</span></>}
                  {task.steps && <><span>·</span><span>{task.steps.length} step{task.steps.length !== 1 ? "s" : ""}</span></>}
                  {isAdmin && typeof task.cost_usd === "number" && <><span>·</span><span>{formatCost(task.cost_usd)}</span></>}
                </div>
              </div>
              <span className="text-[11px] m-faint shrink-0">{timeAgo(task.id)}</span>
            </button>
          ))}
        </Card>
      )}
    </div>
  )
}
