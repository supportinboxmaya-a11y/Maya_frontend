import { useEffect, useState, useRef } from "react"
import { RefreshCw, Check, X } from "lucide-react"
import { Card, Skeleton } from "@/components/maya/ui"
import { api, DEFAULT_AGENT_URL } from "@/lib/api"
import toast from "react-hot-toast"

const MODES = [
  { id: "auto",  label: "Auto",  desc: "Only high-risk actions wait for you" },
  { id: "human", label: "Human", desc: "Every action waits for approval" },
  { id: "skip",  label: "Skip",  desc: "Nothing waits — full autonomy" },
] as const

interface ApprovalItem {
  id: string
  action?: string
  reason?: string
  risk_level?: string
  task_id?: string
  status?: string
}

export function ApprovalsPanel() {
  const [mode, setMode] = useState("auto")
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  // Track which decision is pending (id -> "approve" | "reject")
  const [pendingDecisions, setPendingDecisions] = useState<Record<string, "approve" | "reject">>({})
  // Track pending mode change
  const [modePending, setModePending] = useState(false)
  const prevModeRef = useRef(mode)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [m, a] = await Promise.allSettled([
        api.get("/approval/mode"),
        api.get("/approvals"),
      ])
      if (m.status === "fulfilled") {
        const data = m.value as any
        setMode(data?.mode || "auto")
        prevModeRef.current = data?.mode || "auto"
      }
      if (a.status === "fulfilled") {
        const data = a.value as any
        setItems(data?.approvals || [])
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // WS listener for live approval push
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      const agentUrl = localStorage.getItem("maya_backend_url") || DEFAULT_AGENT_URL
      const base = agentUrl.replace(/^https/, "wss").replace(/^http/, "ws").replace(/\/api\/v1$/, "")
      const token = localStorage.getItem("maya_token") ?? ""
      ws = new WebSocket(`${base}/ws/agent${token ? `?token=${encodeURIComponent(token)}` : ""}`)
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === "approval_requested" && msg.approval) {
            setItems((prev) => [msg.approval, ...prev.filter((a) => a.id !== msg.approval.id)])
            toast("Maya needs your approval", { icon: "⚠️" })
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ws unavailable
    }
    return () => { try { ws?.close() } catch {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Strict switch: read true mode on mount, write on change, show pending, revert on failure
  const changeMode = async (next: string) => {
    const prev = mode
    setModePending(true)
    try {
      await api.put("/approval/mode", { mode: next })
      setMode(next)
      toast.success(`Mode: ${next}`)
    } catch {
      setMode(prev) // revert
      toast.error("Failed to change mode")
    }
    setModePending(false)
  }

  const decide = async (id: string, d: "approve" | "reject") => {
    setPendingDecisions((p) => ({ ...p, [id]: d }))
    try {
      await api.post(`/approvals/${id}/${d}`)
      setItems((p) => p.map((a) => (a.id === id ? { ...a, status: d === "approve" ? "approved" : "rejected" } : a)))
      toast.success(d === "approve" ? "Approved" : "Rejected")
    } catch {
      toast.error("Decision failed — no change made")
    }
    setPendingDecisions((p) => ({ ...p, [id]: undefined } as Record<string, "approve" | "reject">))
  }

  const pending = items.filter((a) => a.status === "pending" || !a.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold m-ink">Approvals</h3>
        <button onClick={fetchAll} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"><RefreshCw size={16} /></button>
      </div>

      {/* Mode selector */}
      <div>
        <h4 className="text-[13px] font-medium m-ink mb-2">Approval Mode</h4>
        <div className="space-y-2">
          {MODES.map((m) => {
            const selected = mode === m.id
            return (
              <button
                key={m.id}
                onClick={() => changeMode(m.id)}
                disabled={modePending || selected}
                className="w-full text-left m-card p-4 m-focus m-press transition-all"
                style={{
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                  background: selected ? "var(--accent-soft)" : "",
                  opacity: modePending && !selected ? 0.4 : 1,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium m-ink">{m.label}</div>
                    <div className="text-[12px] m-muted">{m.desc}</div>
                  </div>
                  {selected && <Check size={16} className="m-accent" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pending approvals */}
      <div>
        <h4 className="text-[13px] font-medium m-ink mb-2">Waiting for You ({pending.length})</h4>
        {loading ? (
          <Card><div className="p-4 space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} h={64} />)}</div></Card>
        ) : pending.length === 0 ? (
          <Card><div className="p-6 text-center text-sm m-muted">Nothing is waiting. Requests appear when Maya needs permission.</div></Card>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => {
              const decisionPending = !!pendingDecisions[a.id]
              return (
                <Card key={a.id} className="p-4 space-y-3">
                  <div className="text-sm font-medium m-ink">{a.action || "Approval needed"}</div>
                  {a.reason && <div className="text-[12px] m-muted">{a.reason}</div>}
                  {a.risk_level && <div className="text-[11px] m-muted">Risk: {a.risk_level}</div>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => decide(a.id, "approve")}
                      disabled={!!decisionPending}
                      className="m-accent-bg rounded-xl px-4 py-2 text-[13px] font-semibold m-press m-focus flex items-center gap-1.5 flex-1 justify-center"
                    >
                      {decisionPending ? "…" : <><Check size={14} /> Approve</>}
                    </button>
                    <button
                      onClick={() => decide(a.id, "reject")}
                      disabled={!!decisionPending}
                      className="m-sunken m-bd rounded-xl px-4 py-2 text-[13px] font-medium m-ink m-press m-focus flex items-center gap-1.5 flex-1 justify-center"
                    >
                      {decisionPending ? "…" : <><X size={14} /> Reject</>}
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
