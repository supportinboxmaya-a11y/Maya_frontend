export type AgentStatus = "idle"|"planning"|"executing"|"verifying"|"learning"|"failed"|"success"
export type TaskStatus = "pending"|"running"|"done"|"failed"|"retrying"
export type Provider = "groq"|"gemini"|"openai"|"claude"|"deepseek"|"local"
export type MemoryType = "short_term"|"long_term"|"episodic"|"semantic"|"vector"|"general"|"chat"|"task_episode"
export type ToolCategory = "web"|"file"|"code"|"system"|"media"|"communication"|"developer"|"custom"

export interface Task {
  id: string; goal: string; status: TaskStatus; result?: string; error?: string
  steps: Step[]; created_at: string; completed_at?: string
  tools_used?: string[]; provider_used?: Provider; cost_usd?: number; tokens_used?: number
}
export interface Step {
  step: number; title: string; description: string; tool?: string
  tool_input?: Record<string,unknown>; result?: string; success?: boolean
  error?: string; duration_ms?: number
}
export interface Memory {
  id: string; content: string; type: MemoryType
  metadata?: Record<string,unknown>; timestamp: string; version?: number
}
export interface Tool {
  name: string; description: string; category: ToolCategory
  enabled: boolean; call_count: number; success_rate: number; avg_duration_ms: number; last_used?: string
}
export interface Plugin {
  id: string; name: string; description: string; version: string
  author: string; category: string; enabled: boolean; installed: boolean
  tools: string[]; rating: number; downloads: number; tags: string[]
}
export interface Workflow {
  id: string; name: string; description?: string
  nodes: unknown[]; edges: unknown[]
  created_at: string; updated_at: string; run_count: number; last_run?: string
}
export interface Notification {
  id: string; type: "success"|"error"|"warning"|"info"
  title: string; message: string; timestamp: string; read: boolean; task_id?: string
}
export interface CostSummary {
  session_start: string; total_calls: number
  total_input_tokens: number; total_output_tokens: number; total_tokens: number
  total_cost_usd: number; budget_usd: number; budget_used_pct: number
  by_provider: Record<string,{calls:number;tokens:number;cost:number}>
}
export interface LLMLog {
  id: string; timestamp: string; provider: Provider; model: string
  input_tokens: number; output_tokens: number; total_tokens: number
  cost_usd: number; response_time_ms: number; task_id?: string; success: boolean
}
export interface ToolLog {
  id: string; timestamp: string; tool_name: string
  input: Record<string,unknown>; output?: string; success: boolean
  duration_ms: number; task_id?: string; error?: string
}