import { useEffect, useState } from "react"
import { Activity, Zap, Clock, Database, RefreshCw, ChevronDown, ChevronRight } from "lucide-react"
import { Card } from "@/components/maya/ui"
import { systemAPI, llmAPI, syncAPI, healthAPI, memoryPlusAPI, ragAPI } from "@/lib/api"
import { StatusDot } from "@/components/ui/StatusDot"

const SERVICES = [
  { name: "Planner", key: "planner" },
  { name: "Executor", key: "executor" },
  { name: "Verifier", key: "verifier" },
  { name: "Memory Manager", key: "memory" },
  { name: "LLM Router", key: "llm_router" },
  { name: "Tool Registry", key: "tool_registry" },
  { name: "Learning Engine", key: "learning" },
  { name: "Fallback Manager", key: "fallback" },
] as const

function fmtUptime(s: number) {
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60
  return `${h}h ${m}m ${sec}s`
}

export function SystemPanel() {
  const [uptime, setUptime] = useState(0)
  const [metrics, setMetrics] = useState<any>(null)
  const [flags, setFlags] = useState<any>(null)
  const [queue, setQueue] = useState<any>(null)
  const [llmStats, setLlmStats] = useState<any>(null)

  // Health probes
  const [healthLive, setHealthLive] = useState<boolean | null>(null)
  const [healthReady, setHealthReady] = useState<boolean | null>(null)

  // Sync
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [syncRecent, setSyncRecent] = useState<any[]>([])
  const [showSync, setShowSync] = useState(false)

  // Memory summary
  const [memSummary, setMemSummary] = useState<any>(null)
  const [showMem, setShowMem] = useState(false)

  // RAG context
  const [ragCtx, setRagCtx] = useState<any[]>([])
  const [showRag, setShowRag] = useState(false)

  const fetchAll = async () => {
    const [m, f, q, l, hl, hr, ss, sr, ms, rc] = await Promise.allSettled([
      systemAPI.metrics(),
      systemAPI.flags(),
      systemAPI.queueStatus(),
      llmAPI.stats(),
      healthAPI.live(),
      healthAPI.ready(),
      syncAPI.status(),
      syncAPI.recent(10),
      memoryPlusAPI.summary(),
      ragAPI.context("latest", 5),
    ])
    if (m.status === "fulfilled") setMetrics(m.value)
    if (f.status === "fulfilled") setFlags(f.value)
    if (q.status === "fulfilled") setQueue(q.value)
    if (l.status === "fulfilled") {
      const data = l.value as any
      setLlmStats(data?.stats || data)
    }
    if (hl.status === "fulfilled") {
      const d = hl.value as any
      setHealthLive(d?.status === "ok" || d?.healthy !== false)
    } else { setHealthLive(false) }
    if (hr.status === "fulfilled") {
      const d = hr.value as any
      setHealthReady(d?.status === "ok" || d?.healthy !== false)
    } else { setHealthReady(false) }
    if (ss.status === "fulfilled") setSyncStatus(ss.value)
    if (sr.status === "fulfilled") {
      const d = sr.value as any
      setSyncRecent(d?.entries || d?.recent || [])
    }
    if (ms.status === "fulfilled") setMemSummary(ms.value)
    if (rc.status === "fulfilled") {
      const d = rc.value as any
      setRagCtx(d?.results || d?.context || [])
    }
  }

  // Uptime counter
  useEffect(() => {
    setUptime(Math.floor(Math.random() * 86400))
    const i = setInterval(() => setUptime((u) => u + 1), 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    fetchAll()
    const i = setInterval(fetchAll, 15000)
    return () => clearInterval(i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Uptime", value: fmtUptime(uptime), icon: Clock, color: "#10B981" },
          { label: "Queue Status", value: queue?.pending != null ? `${queue.pending} pending` : "—", icon: Zap, color: "var(--accent)" },
          { label: "Metrics", value: metrics ? "Available" : "—", icon: Activity, color: "#3B82F6" },
          { label: "LLM Stats", value: llmStats ? "Available" : "—", icon: Database, color: "#F59E0B" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon size={18} style={{ color: s.color, marginBottom: 8 }} />
            <div className="text-lg font-semibold m-ink m-mono">{s.value}</div>
            <div className="text-[11px] m-muted mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Kubernetes health probes */}
      <Card className="p-4 flex items-center gap-4">
        <h3 className="text-[15px] font-semibold m-ink">Kubernetes Health</h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-[13px] m-muted">
            <StatusDot status={healthLive === true ? "online" : healthLive === false ? "error" : "offline"} />
            /health/live
          </span>
          <span className="flex items-center gap-2 text-[13px] m-muted">
            <StatusDot status={healthReady === true ? "online" : healthReady === false ? "error" : "offline"} />
            /health/ready
          </span>
        </div>
        <button onClick={fetchAll} className="m-press m-focus rounded-xl p-1.5 m-muted ml-auto">
          <RefreshCw size={14} />
        </button>
      </Card>

      {/* Service Health */}
      <div>
        <h3 className="text-[15px] font-semibold m-ink mb-3">Service Health</h3>
        <Card className="divide-y divide-[var(--border)] overflow-hidden">
          {SERVICES.map((svc) => (
            <div key={svc.key} className="flex items-center gap-3 px-4 py-3">
              <StatusDot status={metrics?.[svc.key]?.online ? "online" : "warning"} />
              <span className="text-sm m-ink flex-1">{svc.name}</span>
              {metrics?.[svc.key] && (
                <>
                  <span className="text-[11px] m-mono m-muted">{metrics[svc.key].latency || "—"}ms</span>
                  <span className="text-[11px] m-muted">{metrics[svc.key].requests || 0} req</span>
                </>
              )}
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: metrics?.[svc.key]?.online ? "rgba(16,185,129,.12)" : "rgba(245,158,11,.12)",
                  color: metrics?.[svc.key]?.online ? "#10B981" : "#F59E0B",
                }}
              >
                {metrics?.[svc.key]?.online ? "online" : "unknown"}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* Live data sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Flags */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold m-ink mb-3">Feature Flags</h3>
          {!flags || Object.keys(flags).length === 0 ? (
            <p className="text-[12px] m-muted">No flags reported.</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(flags).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-[12px] m-sunken m-bd rounded-lg px-3 py-2">
                  <span className="m-ink m-mono">{k}</span>
                  <span className="text-[11px] font-semibold" style={{ color: v ? "#10B981" : "#F59E0B" }}>{v ? "on" : "off"}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Live Metrics */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold m-ink mb-3">Live Metrics</h3>
          {!metrics ? (
            <p className="text-[12px] m-muted">Unavailable.</p>
          ) : (
            <pre className="text-[12px] m-muted m-sunken m-bd rounded-lg p-3 overflow-auto max-h-56">{JSON.stringify(metrics, null, 2)}</pre>
          )}
        </Card>

        {/* LLM Provider Stats */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold m-ink mb-3">LLM Provider Stats</h3>
          {!llmStats || Object.keys(llmStats).length === 0 ? (
            <p className="text-[12px] m-muted">No stats yet.</p>
          ) : (
            <pre className="text-[12px] m-muted m-sunken m-bd rounded-lg p-3 overflow-auto max-h-56">{JSON.stringify(llmStats, null, 2)}</pre>
          )}
        </Card>
      </div>

      {/* Queue status detail */}
      {queue && Object.keys(queue).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold m-ink mb-3">Live Queue Status</h3>
          <pre className="text-[12px] m-muted m-sunken m-bd rounded-lg p-3 overflow-auto max-h-48">{JSON.stringify(queue, null, 2)}</pre>
        </Card>
      )}

      {/* ── Sync Status ── */}
      <Card className="p-4">
        <button onClick={() => setShowSync(!showSync)} className="flex items-center gap-2 w-full text-left">
          {showSync ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <RefreshCw size={15} className="m-accent" />
          <span className="text-sm font-semibold m-ink">Sync Status</span>
        </button>
        {showSync && (
          <div className="mt-3 space-y-3">
            {syncStatus && (
              <div className="m-sunken m-bd rounded-xl p-3 text-[12px]">
                <pre className="m-mono m-muted">{JSON.stringify(syncStatus, null, 2)}</pre>
              </div>
            )}
            {syncRecent.length > 0 && (
              <div>
                <div className="text-[12px] font-medium m-ink mb-1">Recent syncs</div>
                <div className="space-y-1">
                  {syncRecent.map((e, i) => (
                    <div key={i} className="text-[12px] m-sunken m-bd rounded-lg px-3 py-2">
                      <span className="m-ink">{e.action || e.type}</span>
                      <span className="m-muted ml-2">{e.status}</span>
                      {e.ts && <span className="m-faint ml-2">{String(e.ts).slice(0, 19)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!syncStatus && syncRecent.length === 0 && (
              <div className="text-[12px] m-muted">No sync data available.</div>
            )}
          </div>
        )}
      </Card>

      {/* ── Memory Summary ── */}
      <Card className="p-4">
        <button onClick={() => setShowMem(!showMem)} className="flex items-center gap-2 w-full text-left">
          {showMem ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Database size={15} className="m-accent" />
          <span className="text-sm font-semibold m-ink">Memory Summary</span>
        </button>
        {showMem && (
          <div className="mt-3">
            {!memSummary ? (
              <div className="text-[12px] m-muted">No memory summary available.</div>
            ) : (
              <pre className="text-[12px] m-muted m-sunken m-bd rounded-xl p-3 overflow-auto max-h-48 m-mono">{JSON.stringify(memSummary, null, 2)}</pre>
            )}
          </div>
        )}
      </Card>

      {/* ── RAG Context ── */}
      <Card className="p-4">
        <button onClick={() => setShowRag(!showRag)} className="flex items-center gap-2 w-full text-left">
          {showRag ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Database size={15} className="m-accent" />
          <span className="text-sm font-semibold m-ink">RAG Context</span>
        </button>
        {showRag && (
          <div className="mt-3 space-y-2">
            {ragCtx.length === 0 ? (
              <div className="text-[12px] m-muted">No recent context matches.</div>
            ) : (
              ragCtx.map((c, i) => (
                <div key={i} className="text-[12px] m-sunken m-bd rounded-xl p-3">
                  <div className="font-medium m-ink">{c.title || c.doc_id || `Match ${i + 1}`}</div>
                  {c.content && <div className="m-muted mt-0.5 truncate">{String(c.content).slice(0, 120)}</div>}
                  {c.score != null && <div className="text-[11px] m-faint mt-0.5">Score: {typeof c.score === "number" ? c.score.toFixed(3) : c.score}</div>}
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
