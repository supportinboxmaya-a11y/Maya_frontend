import { api } from "@/lib/api"
export interface AgentStep { step?: number; title?: string; description?: string; tool?: string; result?: string; success?: boolean; error?: string }
export interface AgentTask { id: string; goal: string; status: string; steps: AgentStep[]; current_phase?: string; provider_used?: string; cost_usd?: number; tokens_used?: number; result?: string; error?: string }
export interface AgentApproval { id: string; action?: string; reason?: string; risk_level?: string; task_id?: string; status?: string }
export type WSMessage = { type: string; task?: AgentTask; task_id?: string; approval?: AgentApproval; message?: string }
export const approvalsAPI = { list: () => api.get("/approvals"), decide: (id: string, d: "approve"|"reject") => api.post(`/approvals/${id}/${d}`), getMode: () => api.get("/approval/mode"), setMode: (m: string) => api.put("/approval/mode", { mode: m }) }
export function stepStatus(s: AgentStep): "done"|"failed"|"running" { if (s.error || s.success === false) return "failed"; if (s.success === true || (s.result && s.result.length > 0)) return "done"; return "running" }
