import { useEffect, useState } from "react"
import { RefreshCw, Key } from "lucide-react"
import { Card, Skeleton } from "@/components/maya/ui"
import { llmAPI, api } from "@/lib/api"
import toast from "react-hot-toast"

interface Provider {
  id: string; name: string; label: string
  enabled: boolean; configured: boolean; active?: boolean
}

interface ToggleState {
  [id: string]: "pending" | boolean
}

export function ProvidersPanel() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [toggleState, setToggleState] = useState<ToggleState>({})
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<Record<string, boolean>>({})

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.allSettled([api.get("/llm/providers"), llmAPI.stats()])
      if (p.status === "fulfilled") {
        const data = p.value as any
        // Read true state from server
        setProviders(data?.providers || [])
      }
      if (s.status === "fulfilled") {
        const data = s.value as any
        setStats(data?.stats || data || null)
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // Strict switch: read true state on mount, write on change, show pending, revert on failure
  const toggle = async (p: Provider) => {
    const id = p.id || p.name
    const prev = p.enabled
    // Show pending state
    setToggleState((t) => ({ ...t, [id]: "pending" }))
    try {
      await api.post(`/llm/providers/${id}/toggle`, {})
      // On success: read true state from response or optimistically confirm
      setProviders((prevP) => prevP.map((x) => ((x.id || x.name) === id ? { ...x, enabled: !prev } : x)))
      setToggleState((t) => ({ ...t, [id]: !prev }))
      toast.success(`${p.label} ${prev ? "disabled" : "enabled"}`)
    } catch {
      // Failure: revert — display stays at previous state
      setToggleState((t) => ({ ...t, [id]: prev }))
      toast.error(`Failed to toggle ${p.label}`)
    }
  }

  const saveKey = async (p: Provider) => {
    const id = p.id || p.name
    const key = keyInputs[id]?.trim()
    if (!key) return toast.error("Enter an API key")
    setSavingKey((s) => ({ ...s, [id]: true }))
    try {
      await api.put(`/llm/providers/${id}/key`, { api_key: key })
      setProviders((prev) => prev.map((x) => ((x.id || x.name) === id ? { ...x, configured: true } : x)))
      setKeyInputs((k) => ({ ...k, [id]: "" }))
      toast.success(`${p.label} key saved`)
    } catch {
      toast.error(`Failed to save key for ${p.label}`)
    }
    setSavingKey((s) => ({ ...s, [id]: false }))
  }

  const isEnabled = (p: Provider): boolean => {
    const id = p.id || p.name
    const state = toggleState[id]
    if (state === "pending") return !p.enabled // show the target state while pending
    return p.enabled
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold m-ink">LLM Providers</h3>
        <button onClick={fetchAll} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <Card><div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={56} />)}</div></Card>
      ) : providers.length === 0 ? (
        <Card><div className="p-6 text-center text-sm m-muted">No providers found.</div></Card>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => {
            const id = p.id || p.name
            const pending = toggleState[id] === "pending"
            const on = isEnabled(p)
            return (
              <Card key={id} className="p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full flex-shrink-0"
                    style={{ width: 10, height: 10, background: p.active ? "#10B981" : p.configured ? "#F59E0B" : "#64748B" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium m-ink">{p.label}</div>
                    <div className="text-[12px] m-muted">{p.configured ? "Key set" : "No key"}</div>
                  </div>
                  <button
                    onClick={() => toggle(p)}
                    disabled={!p.configured || pending}
                    className="w-10 h-5 rounded-full relative transition-colors m-press flex-shrink-0"
                    style={{ background: on && p.configured ? "var(--accent)" : "var(--border)", opacity: !p.configured ? 0.4 : 1 }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: on ? 20 : 2 }}
                    />
                  </button>
                </div>
                {/* API key input */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 flex items-center gap-2 m-sunken m-bd rounded-xl px-3 py-1.5">
                    <Key size={13} className="m-muted" />
                    <input
                      value={keyInputs[id] ?? ""}
                      onChange={(e) => setKeyInputs((k) => ({ ...k, [id]: e.target.value }))}
                      placeholder={p.configured ? "Replace key…" : "Set API key…"}
                      type="password"
                      className="flex-1 bg-transparent outline-none text-[13px] m-ink placeholder:text-[var(--faint)]"
                    />
                  </div>
                  <button
                    onClick={() => saveKey(p)}
                    disabled={!keyInputs[id]?.trim() || savingKey[id]}
                    className="m-accent-bg rounded-xl px-3 py-1.5 text-[12px] font-medium m-press m-focus"
                  >
                    {savingKey[id] ? "…" : "Save"}
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Stats */}
      <div>
        <h3 className="text-[15px] font-semibold m-ink mb-3">Provider Stats</h3>
        {!stats || Object.keys(stats).length === 0 ? (
          <Card><div className="p-6 text-center text-sm m-muted">No stats yet.</div></Card>
        ) : (
          <Card className="p-4">
            <pre className="text-[12px] m-muted overflow-x-auto">{JSON.stringify(stats, null, 2)}</pre>
          </Card>
        )}
      </div>
    </div>
  )
}
