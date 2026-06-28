import { useState, useCallback } from "react"

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: false, error: null })

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await fn()
      setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      setState(s => ({ ...s, loading: false, error }))
      throw err
    }
  }, [])

  return { ...state, execute }
}