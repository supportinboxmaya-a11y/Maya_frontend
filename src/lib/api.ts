import axios from "axios"

// ── Two-backend architecture ───────────────────
// AGENT (Render, Python): auth + agent + tasks + memory + tools +
//   workflows + analytics + logs + backup + plugins + vision + voice
// WORKER (Cloudflare): edge/light work (quick chat, D1/KV)
//
// AGENT_URL can be overridden at runtime (Settings page) via localStorage,
// e.g. when migrating from Render to a VPS — no rebuild/redeploy needed for
// that switch. VITE_AGENT_URL (build-time) is the default before any
// override is set.
export const DEFAULT_AGENT_URL = import.meta.env.VITE_AGENT_URL || "https://m-2-0.onrender.com/api/v1"
const AGENT_URL = localStorage.getItem("maya_backend_url") || DEFAULT_AGENT_URL
const WORKER_URL = import.meta.env.VITE_API_URL || "https://maya-brain-api2.supportinbox-maya.workers.dev"

// Called from Settings. Reloads the page so every client (api, workerApi,
// websocket) re-initializes against the new URL — simpler and more reliable
// than trying to swap baseURL on already-created axios instances mid-session.
export function setBackendUrl(url: string) {
  const trimmed = url.trim().replace(/\/+$/, "")
  if (trimmed) localStorage.setItem("maya_backend_url", trimmed)
  else localStorage.removeItem("maya_backend_url")
  window.location.reload()
}
export function getEffectiveBackendUrl(): string {
  return localStorage.getItem("maya_backend_url") || DEFAULT_AGENT_URL
}

// Primary client -> Render backend (all pages use this)
export const api = axios.create({
  baseURL: AGENT_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("maya_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/health')) {
      localStorage.removeItem("maya_token")
      window.location.href = "/auth"
    }
    return Promise.reject(err.response?.data || err.message)
  }
)

// Secondary client -> Cloudflare Worker (edge / quick tasks)
export const workerApi = axios.create({
  baseURL: WORKER_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
})

workerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("worker_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

workerApi.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data || err.message)
)

// ── Agent (Render) ─────────────────────────────
export const agentAPI = {
  run: (goal: string, budget_usd?: number) =>
    api.post("/agent/run", { goal, budget_usd }),
  chat: (message: string, chat_id?: string) =>
    api.post("/agent/chat", { message, chat_id }),
  think: (problem: string, depth = "normal") =>
    api.post("/agent/think", { problem, depth }),
  status: () => api.get("/agent/status"),
}

// ── Worker (edge) ──────────────────────────────
export const workerAPI = {
  chat: (message: string) =>
    workerApi.post("/agent/chat", { message }),
  health: () => workerApi.get("/health"),
}

// ── Tasks ──────────────────────────────────────
export const taskAPI = {
  list: (params?: { limit?: number; status?: string }) =>
    api.get("/tasks", { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (goal: string) => api.post("/tasks", { goal }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
}

// ── Memory ─────────────────────────────────────
export const memoryAPI = {
  list: (params?: { type?: string; limit?: number }) =>
    api.get("/memory", { params }),
  search: (q: string, limit = 10) =>
    api.get("/memory/search", { params: { q, limit } }),
  add: (content: string, type = "general") =>
    api.post("/memory", { content, type }),
  update: (id: string, content: string) => api.put(`/memory/${id}`, { content }),
  getVersions: (id: string) => api.get(`/memory/${id}/versions`),
  delete: (id: string) => api.delete(`/memory/${id}`),
  stats: () => api.get("/memory/stats"),
  analytics: () => api.get("/memory/analytics"),
  cleanup: (dryRun = true) => api.post("/memory/cleanup", null, { params: { dry_run: dryRun } }),
  compress: (memoryType = "general", keepRecent = 20, dryRun = true) =>
    api.post("/memory/compress", null, { params: { memory_type: memoryType, keep_recent: keepRecent, dry_run: dryRun } }),
}

// ── Tools ──────────────────────────────────────
export const toolAPI = {
  list: () => api.get("/tools"),
  run: (name: string, input: Record<string, unknown>) =>
    api.post(`/tools/${name}/run`, { input }),
  update: (name: string, enabled: boolean) =>
    api.put(`/tools/${name}`, { enabled }),
  logs: (limit = 50) => api.get("/tools/logs", { params: { limit } }),
}

// ── Providers (LLM key control) ────────────────
export const providerAPI = {
  list: () => api.get("/providers"),
  update: (id: string, enabled: boolean) =>
    api.put(`/providers/${id}`, { enabled }),
}

// ── Workflows ──────────────────────────────────
export const workflowAPI = {
  list: () => api.get("/workflows"),
  create: (data: unknown) => api.post("/workflows", data),
  update: (id: string, data: unknown) => api.put(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  run: (id: string) => api.post(`/workflows/${id}/run`),
}

// ── Analytics ──────────────────────────────────
export const analyticsAPI = {
  summary: () => api.get("/analytics/summary"),
  daily: (days = 7) => api.get("/analytics/daily", { params: { days } }),
  providers: () => api.get("/analytics/providers"),
  tools: () => api.get("/analytics/tools"),
}

// ── Memory+ (Phase 2: rank / cleanup / summary) ─
export const memoryPlusAPI = {
  rank: (q: string, limit = 5) =>
    api.get("/memory/rank", { params: { q, limit } }),
  cleanup: (dry_run = true) =>
    api.post("/memory/cleanup", null, { params: { dry_run } }),
  summary: (q = "", limit = 20) =>
    api.get("/memory/summary", { params: { q, limit } }),
}

// ── Brain (Phase 3: analyze / graph) ───────────
export const brainAPI = {
  analyze: (goal: string) => api.get("/brain/analyze", { params: { goal } }),
  graph: (steps: unknown[]) => api.post("/brain/graph", { steps }),
}

// ── Multi-Agent (Phase 4) ──────────────────────
export const agentsAPI = {
  list: () => api.get("/agents"),
  orchestrate: (goal: string) => api.post("/agents/orchestrate", { goal }),
  run: (goal: string) => api.post("/agents/run", { goal }),
  messages: (limit = 50) => api.get("/agents/messages", { params: { limit } }),
}

// ── Tool Framework (Phase 5) ───────────────────
export const toolFrameworkAPI = {
  list: () => api.get("/tools/framework"),
  execute: (name: string, inputs: Record<string, unknown>, approved = false) =>
    api.post("/tools/execute", { name, inputs, approved }),
}

// ── Workflow Runs (Phase 6: resumable engine) ──
export const workflowRunAPI = {
  plan: (goal: string) => api.post("/workflows/plan", { goal }),
  runs: () => api.get("/workflows/runs"),
  state: (runId: string) => api.get(`/workflows/runs/${runId}`),
  cancel: (runId: string) => api.post(`/workflows/runs/${runId}/cancel`),
}

// ── Autonomous Mode (Phase 7, flag-gated) ──────
export const autonomousAPI = {
  run: (goal: string, approve_dangerous = false) =>
    api.post("/autonomous/run", { goal, approve_dangerous }),
}

// ── LLM Router+ (Phase 8) ──────────────────────
export const llmAPI = {
  stats: () => api.get("/llm/stats"),
  strategy: (strategy = "balanced") =>
    api.get("/llm/strategy", { params: { strategy } }),
}

// ── System (Phase 1: metrics / flags / queue) ──
export const systemAPI = {
  metrics: () => api.get("/metrics"),
  flags: () => api.get("/flags"),
  queueStatus: () => api.get("/queue/status"),
  health: () => api.get("/health", { baseURL: AGENT_URL.replace(/\/api\/v1$/, "") }),
}

// ── Learning Layer (Phase 10) ──────────────────
export const learningAPI = {
  feedback: (goal: string, output: string, rating: number, comment = "") =>
    api.post("/learning/feedback", { goal, output, rating, comment }),
  stats: () => api.get("/learning/stats"),
  experience: (goal = "", limit = 10) =>
    api.get("/learning/experience", { params: goal ? { goal, limit } : { limit } }),
  compress: (memory_type = "chat", dry_run = true) =>
    api.post("/learning/compress", { memory_type, dry_run }),
}

// ── Webhooks (outbound event notifications) ────
export const webhookAPI = {
  list: () => api.get("/webhooks"),
  create: (name: string, url: string, events: string[] = ["task.done"]) =>
    api.post("/webhooks", { name, url, events, active: true }),
  update: (id: string, data: Record<string, unknown>) => api.put(`/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/webhooks/${id}`),
}

// ── Admin / Enterprise (Phase 9) ───────────────
export const adminAPI = {
  roles: () => api.get("/admin/roles"),
  orgs: () => api.get("/admin/orgs"),
  createOrg: (name: string) => api.post("/admin/orgs", { name }),
  deleteOrg: (id: string) => api.delete(`/admin/orgs/${id}`),
  removeMember: (orgId: string, email: string) => api.delete(`/admin/orgs/${orgId}/members/${encodeURIComponent(email)}`),
  apiKeys: () => api.get("/admin/apikeys"),
  createApiKey: (data: unknown) => api.post("/admin/apikeys", data),
  revokeApiKey: (id: string) => api.delete(`/admin/apikeys/${id}`),
  audit: () => api.get("/admin/audit"),
  usage: () => api.get("/admin/usage"),
  dashboard: () => api.get("/admin/dashboard"),
  // Multi-user (Supabase) — user management
  users: () => api.get("/admin/users"),
  banUser: (id: string, banned: boolean) => api.put(`/admin/users/${id}/ban`, { banned }),
  setUserBudget: (id: string, budget_usd: number) => api.put(`/admin/users/${id}/budget`, { budget_usd }),
}

// ── Current user (multi-user mode) ─────────────
export const meAPI = {
  get: () => api.get("/users/me"),
}

// ── Auth (Render issues the token) ─────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post("/auth/register", { name, email, password }),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
}

// ── WebSocket ──────────────────────────────────
export function createWebSocket(onMessage: (data: unknown) => void) {
  // Derive WS endpoint from the agent URL so production works without extra config
  const base = import.meta.env.VITE_WS_URL ||
    AGENT_URL.replace(/^https/, "wss").replace(/^http/, "ws").replace(/\/api\/v1$/, "")
  const token = localStorage.getItem("maya_token")
  const ws = new WebSocket(`${base}/ws/agent${token ? `?token=${encodeURIComponent(token)}` : ""}`)

  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) }
    catch { console.error("WS parse error", e.data) }
  }

  return ws
}
