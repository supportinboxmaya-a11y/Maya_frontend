import { useEffect, useState } from "react"
import { RefreshCw, Send, MessageSquare } from "lucide-react"
import { Card, Skeleton } from "@/components/maya/ui"
import { agentsAPI } from "@/lib/api"
import { timeAgo } from "@/lib/utils"
import toast from "react-hot-toast"

export function AgentsPanel() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [orchestrateInput, setOrchestrateInput] = useState("")
  const [busy, setBusy] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const m = await agentsAPI.messages(50)
      setMessages(Array.isArray(m) ? m : [])
    } catch {
      setMessages([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleOrchestrate = async () => {
    const q = orchestrateInput.trim()
    if (!q || busy) return
    setBusy(true)
    try {
      await agentsAPI.orchestrate(q)
      toast.success("Orchestration started")
      setOrchestrateInput("")
      setTimeout(fetchAll, 2000)
    } catch (e: any) {
      toast.error(e?.message || "Orchestration failed")
    }
    setBusy(false)
  }

  return (
    <div className="space-y-6">
      {/* Orchestrate */}
      <div>
        <h3 className="text-[15px] font-semibold m-ink mb-3">Multi-Agent Orchestration</h3>
        <Card className="p-4">
          <div className="flex items-center gap-2 m-sunken m-bd rounded-2xl px-3 py-2">
            <input
              value={orchestrateInput}
              onChange={(e) => setOrchestrateInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleOrchestrate() }}
              placeholder="Describe a multi-agent goal…"
              className="flex-1 bg-transparent outline-none text-[14px] m-ink placeholder:text-[var(--faint)]"
            />
            <button onClick={handleOrchestrate} disabled={!orchestrateInput.trim() || busy} className="m-accent-bg rounded-xl p-2 m-press m-focus" style={{ opacity: orchestrateInput.trim() ? 1 : 0.3 }}>
              <Send size={15} />
            </button>
          </div>
        </Card>
      </div>

      {/* Agent messages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold m-ink">Agent Messages</h3>
          <button onClick={fetchAll} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"><RefreshCw size={16} /></button>
        </div>
        {loading ? (
          <Card><div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={40} />)}</div></Card>
        ) : messages.length === 0 ? (
          <Card><div className="p-6 text-center text-sm m-muted">No agent messages yet.</div></Card>
        ) : (
          <Card className="divide-y divide-[var(--border)] overflow-hidden">
            {messages.slice(0, 30).map((m, i) => (
              <div key={m.id || i} className="flex items-start gap-3 px-4 py-3">
                <span className="rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: "var(--accent-soft)", flexShrink: 0 }}>
                  <MessageSquare size={12} className="m-accent" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] m-ink truncate">{(m.content || m.message || JSON.stringify(m)).slice(0, 240)}</div>
                  <div className="flex items-center gap-2 text-[11px] m-muted mt-0.5">
                    <span>{m.agent_name || m.role || "agent"}</span>
                    {m.ts && <><span>·</span><span>{timeAgo(m.ts)}</span></>}
                    {m.type && <><span>·</span><span>{m.type}</span></>}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}
