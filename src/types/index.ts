export type AgentStatus = 'idle'|'planning'|'executing'|'verifying'|'learning'|'failed'|'success'
export type TaskStatus = 'pending'|'running'|'done'|'failed'|'retrying'
export type Provider = 'groq'|'gemini'|'openai'|'claude'|'deepseek'|'local'
export type MemoryType = 'short_term'|'long_term'|'episodic'|'semantic'|'vector'|'general'|'chat'|'task_episode'
export type ToolCategory = 'web'|'file'|'code'|'system'|'media'|'communication'|'developer'|'custom'
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
  metadata?: Record<string,unknown>; timestamp: string
}
export interface Tool {
  name: string; description: string; category: ToolCategory
  enabled: boolean; call_count: number; success_rate: number; avg_duration_ms: number
}
export interface Plugin {
  id: string; name: string; description: string; version: string
  author: string; category: string; enabled: boolean; installed: boolean
  tools: string[]; rating: number; downloads: number; tags: string[]
}
export interface Notification {
  id: string; type: 'success'|'error'|'warning'|'info'
  title: string; message: string; timestamp: string; read: boolean
}
export interface CostSummary {
  total_calls: number; total_tokens: number; total_cost_usd: number
  budget_usd: number; budget_used_pct: number
  by_provider: Record<string,{calls:number;tokens:number;cost:number}>
}