import { useEffect, useState } from "react"
import { Wrench, RefreshCw, Play, X } from "lucide-react"
import { Card, Skeleton } from "@/components/maya/ui"
import { toolAPI } from "@/lib/api"
import type { Tool } from "@/types"
import toast from "react-hot-toast"

export function ToolsPanel() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)

  // Run modal
  const [runTool, setRunTool] = useState<Tool | null>(null)
  const [paramsJson, setParamsJson] = useState("{}")
  const [runOutput, setRunOutput] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  // Toggle tracking — store id -> boolean for pending state
  const [pendingToggle, setPendingToggle] = useState<Record<string, boolean>>({})

  const fetchTools = async () => {
    setLoading(true)
    try {
      const data = await toolAPI.list()
      setTools((data as any) || [])
    } catch {
      setTools([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchTools() }, [])

  const toggle = async (tool: Tool) => {
    const id = tool.name
    const prev = tool.enabled
    // Show pending immediately
    setPendingToggle((p) => ({ ...p, [id]: true }))
    try {
      await toolAPI.update(id, !prev)
      setTools((prevTools) => prevTools.map((t) => (t.name === id ? { ...t, enabled: !prev } : t)))
      toast.success(`${id} ${prev ? "disabled" : "enabled"}`)
    } catch {
      // Revert — no state change
      toast.error(`Failed to update ${id}`)
    } finally {
      setPendingToggle((p) => ({ ...p, [id]: false }))
    }
  }

  const openRun = (tool: Tool) => {
    setRunTool(tool)
    setParamsJson("{}")
    setRunOutput(null)
  }

  const runToolFn = async () => {
    if (!runTool) return
    let input: Record<string, unknown>
    try {
      input = JSON.parse(paramsJson)
    } catch {
      toast.error("Params must be valid JSON")
      return
    }
    setRunning(true)
    setRunOutput(null)
    try {
      const res: any = await toolAPI.run(runTool.name, input)
      setRunOutput(typeof res?.result === "string" ? res.result : JSON.stringify(res?.result, null, 2))
      fetchTools()
    } catch (e: any) {
      toast.error(e?.detail || "Tool run failed")
    }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold m-ink">All Tools</h3>
        <button onClick={fetchTools} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <Card><div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={64} />)}</div></Card>
      ) : tools.length === 0 ? (
        <Card><div className="p-6 text-center text-sm m-muted">No tools found — backend offline.</div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map((tool) => {
            const pending = pendingToggle[tool.name]
            return (
              <Card key={tool.name} className="p-4 flex items-start gap-3">
                <span className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: "var(--accent-soft)", flexShrink: 0 }}>
                  <Wrench size={14} className="m-accent" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium m-ink">{tool.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full m-sunken m-muted">{tool.category}</span>
                  </div>
                  <div className="text-[12px] m-muted mb-2">{tool.description}</div>
                  <div className="flex gap-3 text-[10px] m-faint">
                    <span>{tool.call_count} calls</span>
                    <span>{tool.success_rate}% success</span>
                    <span>{tool.avg_duration_ms}ms avg</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggle(tool)}
                    disabled={pending}
                    className="w-10 h-5 rounded-full relative transition-colors m-press"
                    style={{ background: tool.enabled && !pending ? "var(--accent)" : pending ? "var(--accent)" : "var(--border)" }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: tool.enabled || pending ? 20 : 2 }}
                    />
                  </button>
                  <button
                    onClick={() => openRun(tool)}
                    disabled={!tool.enabled}
                    className="m-accent-soft rounded-lg px-2 py-1 text-[11px] font-medium m-accent m-press m-focus"
                    style={{ opacity: tool.enabled ? 1 : 0.3 }}
                  >
                    <Play size={10} /> Run
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Run modal */}
      {runTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setRunTool(null)}>
          <div className="m-card p-4 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-3" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold m-ink">Run: {runTool.name}</h3>
              <button onClick={() => setRunTool(null)} className="m-press m-focus p-1 rounded-lg"><X size={16} className="m-muted" /></button>
            </div>
            <p className="text-[12px] m-muted">{runTool.description}</p>
            <div>
              <label className="text-[12px] m-muted">Input (JSON)</label>
              <textarea
                value={paramsJson}
                onChange={(e) => setParamsJson(e.target.value)}
                rows={5}
                className="w-full m-sunken m-bd rounded-xl p-3 text-[12px] m-mono m-ink resize-none outline-none mt-1"
              />
            </div>
            <button onClick={runToolFn} disabled={running} className="m-accent-bg rounded-xl px-4 py-2 text-[13px] font-semibold m-press m-focus flex items-center gap-2">
              {running ? <span className="m-spin" style={{ width: 14, height: 14, borderRadius: 999, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", display: "inline-block" }} /> : <Play size={14} />}
              Run
            </button>
            {runOutput !== null && (
              <pre className="text-[12px] m-muted m-sunken m-bd rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-64">{runOutput}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
