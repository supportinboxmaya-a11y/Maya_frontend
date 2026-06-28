import { useState } from "react"
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(()=>{
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initial }
    catch { return initial }
  })
  const set = (val: T) => { setValue(val); window.localStorage.setItem(key, JSON.stringify(val)) }
  return [value, set] as const
}