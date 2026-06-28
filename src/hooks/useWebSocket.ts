import { useEffect, useRef, useCallback } from "react"
import { createWebSocket } from "@/lib/api"

export function useWebSocket(onMessage: (data: unknown) => void) {
  const wsRef = useRef<WebSocket|null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    wsRef.current = createWebSocket((data) => onMessageRef.current(data))
    wsRef.current.onclose = () => {
      reconnectRef.current = setTimeout(() => connect(), 3000)
    }
    wsRef.current.onerror = (e) => {
      console.error("WebSocket error", e)
      wsRef.current?.close()
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current)
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { send, connect, disconnect }
}
