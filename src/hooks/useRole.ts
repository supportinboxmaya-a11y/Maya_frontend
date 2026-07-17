import { useQuery } from "@tanstack/react-query"
import { meAPI } from "@/lib/api"

export function useRole() {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => meAPI.get() as Promise<{ role?: string }>,
    retry: 1,
    staleTime: 60_000,
  })

  const role = data?.role === "admin" ? "admin" : "user"
  return { role, isAdmin: role === "admin", loading: isLoading }
}
