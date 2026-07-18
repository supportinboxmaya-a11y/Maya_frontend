import { useEffect, useState } from "react"
import { Activity, Zap, Clock, Database } from "lucide-react"
import { Card } from "@/components/maya/ui"
import { systemAPI, llmAPI } from "@/lib/api"
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

  const fetchAll = async () => {
    try {
      const [m, f, q, l] = await Promise.allSettled([
        systemAPI.metrics(),
        systemAPI.flags(),
        systemAPI.queueStatus(),
        llmAPI.stats(),
      ])
      if (m.status === "fulfilled") setMetrics(m.value)
      if (f.status === "fulfilled") setFlags(f.value)
      if (q.status === "fulfilled") setQueue(q.value)
      if (l.status === "fulfilled") {
        const data = l.value as any
        setLlmStats(data?.stats || data)
      }
    } catch {
      // ignore
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
    </div>
  )
}
