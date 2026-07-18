import { useEffect, useRef } from "react"
import { useLiveStore } from "@/store/live"
import { agentAPI, taskAPI, DEFAULT_AGENT_URL } from "@/lib/api"
import type { WSMessage, AgentTask } from "@/lib/agentLive"

/**
 * Singleton WS + polling fallback.
 * Place once at the app root — feeds the zustand live store.
 *
 * ── WS ──
 * Connects via `/ws/agent?token=<jwt>`, sends `ping` every 25s,
 * reconnects with exponential backoff (1s, 2s, 4s … capped at 30s).
 *
 * ── Fallback ──
 * When WS closes (or never opens) start polling /agent/status + /tasks
 * every 3s so the UI never shows blank.  Stops polling when WS reconnects.
 */
export function LiveConnection() {
  const onMessage = useLiveStore((s) => s.onWSMessage)
  const setConnected = useLiveStore((s) => s.setConnected)
  const setTasksFromPoll = useLiveStore((s) => s.setTasksFromPoll)

  const wsRef = useRef<WebSocket | null>(null)
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backoffRef = useRef(1000)
  const destroyedRef = useRef(false)

  // ── build WS URL ──
  const agentUrl = localStorage.getItem("maya_backend_url") || DEFAULT_AGENT_URL
  const wsUrl = agentUrl
    .replace(/^https/, "wss")
    .replace(/^http/, "ws")
    .replace(/\/api\/v1$/, "")
  const token = localStorage.getItem("maya_token") ?? ""
  const fullWsUrl = `${wsUrl}/ws/agent${token ? `?token=${encodeURIComponent(token)}` : ""}`

  // ── stop polling ──
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  // ── start polling fallback ──
  const startPolling = () => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const [statusRes, tasksRes] = await Promise.allSettled([
          agentAPI.status(),
          taskAPI.list({ limit: 20 }),
        ])
        if (statusRes.status === "fulfilled" && statusRes.value) {
          // status may contain a current_task payload
          const s = statusRes.value as { current_task?: AgentTask }
          if (s.current_task) setTasksFromPoll([s.current_task])
        }
        if (tasksRes.status === "fulfilled") {
          const arr: AgentTask[] = Array.isArray(tasksRes.value) ? tasksRes.value.filter(Boolean) : []
          setTasksFromPoll(arr)
        }
      } catch {
        // polling failed silently — next tick will retry
      }
    }, 3000)
  }

  // ── connect WS ──
  const connect = () => {
    if (destroyedRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(fullWsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        backoffRef.current = 1000
        stopPolling()

        // ping every 25s
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }))
        }, 25_000)
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as WSMessage
          onMessage(msg)
        } catch {
          // ignore malformed frames
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (pingRef.current) {
          clearInterval(pingRef.current)
          pingRef.current = null
        }
        wsRef.current = null

        // start polling fallback immediately
        startPolling()

        // exponential backoff reconnect
        const delay = backoffRef.current
        backoffRef.current = Math.min(backoffRef.current * 2, 30_000)
        reconnectRef.current = setTimeout(() => connect(), delay)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      // connection failed — onclose will trigger reconnect + polling
    }
  }

  // ── disconnect cleanup ──
  const disconnect = () => {
    destroyedRef.current = true
    if (pingRef.current) clearInterval(pingRef.current)
    if (reconnectRef.current) clearTimeout(reconnectRef.current)
    stopPolling()
    wsRef.current?.close()
    wsRef.current = null
  }

  useEffect(() => {
    destroyedRef.current = false
    backoffRef.current = 1000
    connect()
    return () => disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
