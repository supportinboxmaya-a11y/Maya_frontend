import { useCallback, useEffect, useRef, useState } from "react"
import { agentAPI, createWebSocket } from "@/lib/api"
import { approvalsAPI, type AgentTask, type AgentApproval, type WSMessage } from "@/lib/agentLive"
export type RunStatus = "idle"|"running"|"waiting_approval"|"done"|"failed"
export function useAgentRun() {
  const [task, setTask] = useState<AgentTask|null>(null)
  const [approval, setApproval] = useState<AgentApproval|null>(null)
  const [status, setStatus] = useState<RunStatus>("idle")
  const [error, setError] = useState<string|null>(null)
  const wsRef = useRef<WebSocket|null>(null); const targetId = useRef<string|null>(null); const goalRef = useRef("")
  const ms = (s?: string): RunStatus => s === "failed" ? "failed" : s === "done" ? "done" : s === "waiting_approval" ? "waiting_approval" : "running"
  const ensureWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return wsRef.current
    try {
      const ws = createWebSocket((data) => {
        const m = data as WSMessage; if (!m || !m.type) return
        const id = m.task?.id || m.task_id
        if (!targetId.current && m.task && (!goalRef.current || m.task.goal === goalRef.current)) targetId.current = m.task.id
        const mine = id && targetId.current && id === targetId.current
        if ((m.type === "task_started" || m.type === "task_progress") && m.task && (mine || !targetId.current)) { if (!targetId.current) targetId.current = m.task.id; setTask(m.task); setStatus(ms(m.task.status)) }
        else if (m.type === "approval_requested" && m.approval) { if (!m.approval.task_id || !targetId.current || m.approval.task_id === targetId.current) { setApproval(m.approval); setStatus("waiting_approval") } }
        else if (m.type === "task_done" && m.task && mine) { setTask(m.task); setStatus(ms(m.task.status)); setApproval(null) }
      })
      wsRef.current = ws; return ws
    } catch { return null }
  }, [])
  useEffect(() => () => { try { wsRef.current?.close() } catch {} }, [])
  const start = useCallback(async (goal: string) => {
    setTask(null); setApproval(null); setError(null); setStatus("running"); targetId.current = null; goalRef.current = goal; ensureWS()
    try { const r = (await agentAPI.run(goal)) as any; const t = r?.steps ? r : r?.task; const id = t?.id || r?.task_id || r?.id; if (id) targetId.current = id; if (t?.steps) { setTask(t); setStatus(ms(t.status)) } }
    catch (e: any) { setError(typeof e === "string" ? e : e?.message || "Run failed"); setStatus("failed") }
  }, [ensureWS])
  const decide = useCallback(async (d: "approve"|"reject") => { if (!approval?.id) return; try { await approvalsAPI.decide(approval.id, d); setApproval(null); setStatus(d === "reject" ? "failed" : "running") } catch (e: any) { setError(typeof e === "string" ? e : e?.message) } }, [approval])
  const reset = useCallback(() => { setTask(null); setApproval(null); setStatus("idle"); setError(null); targetId.current = null }, [])
  return { task, approval, status, error, start, approve: () => decide("approve"), reject: () => decide("reject"), reset }
}
