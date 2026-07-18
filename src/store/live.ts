import { create } from "zustand"
import { api } from "@/lib/api"
import type { AgentTask } from "@/lib/agentLive"
import type { WSMessage } from "@/lib/agentLive"

export interface FeedEvent {
  id: string
  type: "task_started" | "task_progress" | "task_done" | "approval_requested"
  ts: number
  taskId: string
  goal: string
  phase?: string
  tool?: string
  status?: string
  success?: boolean
  error?: string
}

interface LiveState {
  tasks: Record<string, AgentTask>
  feed: FeedEvent[]
  connected: boolean
  currentTaskId: string | null
  /** epoch ms when the current task started — used for elapsed counter */
  currentTaskStartedAt: number | null
  setConnected: (v: boolean) => void
  onWSMessage: (msg: WSMessage) => void
  setTasksFromPoll: (tasks: AgentTask[]) => void
  cancelTask: (id: string) => Promise<void>
  clearFeed: () => void
}

let feedSeq = 0

function makeFeedEvent(
  type: FeedEvent["type"],
  taskId: string,
  goal: string,
  extra?: Partial<FeedEvent>,
): FeedEvent {
  return { id: `fe_${++feedSeq}_${Date.now()}`, type, ts: Date.now(), taskId, goal, ...extra }
}

function toAgentTask(raw: AgentTask): AgentTask {
  return {
    id: raw.id,
    goal: raw.goal || "",
    status: raw.status || "running",
    steps: raw.steps || [],
    current_phase: raw.current_phase,
    provider_used: raw.provider_used,
    cost_usd: raw.cost_usd,
    tokens_used: raw.tokens_used,
    result: raw.result,
    error: raw.error,
  }
}

export const useLiveStore = create<LiveState>((set, get) => ({
  tasks: {},
  feed: [],
  connected: false,
  currentTaskId: null,
  currentTaskStartedAt: null,

  setConnected: (connected) => set({ connected }),

  onWSMessage: (msg) => {
    const { tasks, feed, currentTaskId } = get()

    if (msg.type === "connected" || msg.type === "pong") return

    if (msg.type === "task_started" && msg.task) {
      const t = toAgentTask(msg.task)
      set({
        tasks: { ...tasks, [t.id]: t },
        currentTaskId: t.id,
        currentTaskStartedAt: Date.now(),
        feed: [
          makeFeedEvent("task_started", t.id, t.goal, { phase: t.current_phase }),
          ...feed,
        ].slice(0, 200),
      })
      return
    }

    if (msg.type === "task_progress" && msg.task) {
      const t = toAgentTask(msg.task)
      // derive tool name from the latest step
      const lastStep = t.steps?.[t.steps.length - 1]
      set({
        tasks: { ...tasks, [t.id]: t },
        feed: [
          makeFeedEvent("task_progress", t.id, t.goal, {
            phase: t.current_phase,
            tool: lastStep?.tool,
            status: t.status,
          }),
          ...feed,
        ].slice(0, 200),
      })
      return
    }

    if (msg.type === "task_done" && msg.task) {
      const t = toAgentTask(msg.task)
      const wasCurrent = currentTaskId === t.id
      set({
        tasks: { ...tasks, [t.id]: t },
        currentTaskId: wasCurrent ? null : currentTaskId,
        currentTaskStartedAt: wasCurrent ? null : get().currentTaskStartedAt,
        feed: [
          makeFeedEvent("task_done", t.id, t.goal, {
            phase: t.current_phase,
            success: t.status === "done" || t.status === "success",
            error: t.error,
            status: t.status,
          }),
          ...feed,
        ].slice(0, 200),
      })
      return
    }
  },

  setTasksFromPoll: (rawTasks) => {
    const { tasks, feed } = get()
    const map: Record<string, AgentTask> = {}
    let currentId: string | null = null
    const newEvents: FeedEvent[] = []

    for (const raw of rawTasks) {
      const t = toAgentTask(raw)
      map[t.id] = t
      if (t.status === "running") currentId = t.id
      // if this task is new to us, push a synthetic started event
      if (!tasks[t.id]) {
        newEvents.push(makeFeedEvent("task_started", t.id, t.goal, { phase: t.current_phase, status: t.status }))
      } else if (tasks[t.id]?.status !== t.status) {
        // status transition
        if (t.status === "done" || t.status === "failed" || t.status === "success") {
          newEvents.push(makeFeedEvent("task_done", t.id, t.goal, {
            phase: t.current_phase, success: t.status !== "failed", status: t.status,
          }))
        } else {
          newEvents.push(makeFeedEvent("task_progress", t.id, t.goal, { phase: t.current_phase, status: t.status }))
        }
      }
    }

    set({
      tasks: map,
      currentTaskId: currentId,
      currentTaskStartedAt: currentId ? Date.now() : null,
      feed: [...newEvents, ...feed].slice(0, 200),
    })
  },

  cancelTask: async (id) => {
    try {
      await api.post(`/queue/cancel/${id}`)
    } catch {
      // swallow — caller shows toast if needed
    }
  },

  clearFeed: () => set({ feed: [] }),
}))
