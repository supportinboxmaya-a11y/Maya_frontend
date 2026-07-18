import { useEffect, useState } from "react"
import { Flag, RefreshCw } from "lucide-react"
import { Card, Skeleton } from "@/components/maya/ui"
import { systemAPI, api } from "@/lib/api"
import toast from "react-hot-toast"

export function FlagsPanel() {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  // Track pending toggles — true while API call is in flight
  const [pending, setPending] = useState<Record<string, boolean>>({})

  const fetchFlags = async () => {
    setLoading(true)
    try {
      const f: any = await systemAPI.flags()
      setFlags(f || {})
    } catch {
      setFlags({})
    }
    setLoading(false)
  }

  useEffect(() => { fetchFlags() }, [])

  // Strict switch: read true state on mount, write on change, show pending, revert on failure
  const toggle = async (name: string) => {
    const prev = flags[name]
    // Show pending immediately (disable the switch, visual feedback)
    setPending((p) => ({ ...p, [name]: true }))
    try {
      await api.put("/flags", { name, value: !prev })
      // Read the full flag set from response so the server is authoritative
      setFlags((f) => ({ ...f, [name]: !prev }))
      toast.success(`Flag "${name}" ${prev ? "disabled" : "enabled"}`)
    } catch {
      // Failure: revert — don't change local state
      toast.error(`Failed to update flag "${name}"`)
    } finally {
      setPending((p) => ({ ...p, [name]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold m-ink">Feature Flags</h3>
        <button onClick={fetchFlags} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <Card><div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={48} />)}</div></Card>
      ) : Object.keys(flags).length === 0 ? (
        <Card><div className="p-6 text-center text-sm m-muted">No flags reported by backend.</div></Card>
      ) : (
        <Card className="divide-y divide-[var(--border)] overflow-hidden">
          {Object.entries(flags).map(([name, on]) => {
            const isPending = pending[name]
            return (
              <div key={name} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <Flag size={15} className="m-accent flex-shrink-0" />
                  <span className="text-sm font-mono m-ink truncate">{name}</span>
                </div>
                <button
                  onClick={() => toggle(name)}
                  disabled={isPending}
                  className="w-11 h-6 rounded-full relative transition-colors m-press flex-shrink-0"
                  style={{ background: on ? "var(--accent)" : "var(--border)", opacity: isPending ? 0.5 : 1 }}
                >
                  <span
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: on ? 22 : 3 }}
                  />
                </button>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
