import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useRole } from "@/hooks/useRole"
import { Skeleton } from "@/components/maya/ui"

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useRole()

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 m-rise space-y-4">
        <Skeleton h={32} w="60%" />
        <Skeleton h={16} w="40%" />
        <div className="grid gap-3 mt-6">
          <Skeleton h={64} />
          <Skeleton h={64} />
          <Skeleton h={64} />
        </div>
      </div>
    )
  }

  if (!isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
