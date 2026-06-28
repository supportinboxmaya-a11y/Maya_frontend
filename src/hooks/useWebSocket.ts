import { useEffect, useRef, useCallback } from "react"
import { createWebSocket } from "@/lib/api"

export function useWebSocket(onMessage: (data: unknown) => void) {
  const wsRef = useRef<WebSocket|null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    wsRef.current = createWebSocket(onMessage)
  }, [onMessage])

  const disconnect = useCallback(() => {
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