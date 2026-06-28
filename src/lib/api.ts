import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "https://maya-brain-api2.supportinbox-maya.workers.dev"

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
})

// Auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("maya_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("maya_token")
      window.location.href = "/auth"
    }
    return Promise.reject(err.response?.data || err.message)
  }
)

// ── Agent ──────────────────────────────────────
export const agentAPI = {
  run: (goal: string, budget_usd?: number) =>
    api.post("/agent/run", { goal, budget_usd }),
  chat: (message: string) =>
    api.post("/agent/chat", { message }),
  think: (problem: string, depth = "normal") =>
    api.post("/agent/think", { problem, depth }),
  status: () => api.get("/agent/status"),
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
  delete: (id: string) => api.delete(`/memory/${id}`),
  stats: () => api.get("/memory/stats"),
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

// ── Auth ───────────────────────────────────────
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
  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000"
  const ws = new WebSocket(`${WS_URL}/ws/agent`)

  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) }
    catch { console.error("WS parse error", e.data) }
  }

  return ws
}