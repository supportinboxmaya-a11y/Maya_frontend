import { useEffect, useState } from "react"
import * as apiMod from "@/lib/api"
export function useRole() {
  const [role, setRole] = useState<"admin"|"user">("user")
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    const meAPI = (apiMod as any).meAPI
    if (!meAPI || typeof meAPI.get !== "function") { setLoading(false); return }
    Promise.resolve(meAPI.get()).then((me: any) => { if (alive) setRole(me?.role === "admin" ? "admin" : "user") }).catch(() => { if (alive) setRole("user") }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  return { role, isAdmin: role === "admin", loading }
}
