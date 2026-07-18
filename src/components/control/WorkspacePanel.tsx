import { useEffect, useState } from "react"
import { Layers, Plus, Trash2, Search, RefreshCw } from "lucide-react"
import { Card, Skeleton } from "@/components/maya/ui"
import { workspaceAPI } from "@/lib/api"
import toast from "react-hot-toast"

interface WsMemory { id: string; scope: string; content: string; author: string; memory_type: string; created_at: number }

export function WorkspacePanel() {
  const [scopes] = useState<string[]>(["default"])
  const [activeScope, setActiveScope] = useState("default")
  const [memories, setMemories] = useState<WsMemory[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState("")
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState("")
  const [deletePending, setDeletePending] = useState<Record<string, boolean>>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mRes, sRes] = await Promise.allSettled([
        workspaceAPI.memoryList(activeScope),
        workspaceAPI.memoryStats(activeScope),
      ])
      if (mRes.status === "fulfilled") {
        const d = mRes.value as any
        setMemories(d?.memories || d?.results || [])
      } else { setMemories([]) }
      if (sRes.status === "fulfilled") {
        setStats(sRes.value)
      } else { setStats(null) }
    } catch { setMemories([]); setStats(null) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [activeScope])

  const addMemory = async () => {
    if (!newContent.trim()) return
    try {
      await workspaceAPI.memoryAdd(activeScope, newContent.trim())
      setNewContent("")
      setAdding(false)
      toast.success("Added")
      fetchData()
    } catch (e: any) { toast.error(e?.detail || "Failed to add") }
  }

  const removeMemory = async (id: string) => {
    setDeletePending((p) => ({ ...p, [id]: true }))
    try {
      await workspaceAPI.memoryDelete(activeScope, id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
      toast.success("Deleted")
    } catch { toast.error("Delete failed") }
    setDeletePending((p) => ({ ...p, [id]: false }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold m-ink flex items-center gap-2">
          <Layers size={18} className="m-accent" /> Workspace Memory
        </h3>
        <button onClick={fetchData} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"><RefreshCw size={16} /></button>
      </div>

      {/* Scope selector */}
      <div className="flex gap-2 flex-wrap">
        {scopes.map((s) => (
          <button key={s} onClick={() => setActiveScope(s)}
            data-on={activeScope === s}
            className="px-3 py-1.5 rounded-xl text-[12px] font-medium m-focus transition-colors"
            style={{
              background: activeScope === s ? "var(--accent-soft)" : "var(--sunken)",
              color: activeScope === s ? "var(--accent)" : "var(--muted)",
            }}
          >{s}</button>
        ))}
      </div>

      {/* Stats card */}
      {stats && (
        <Card className="p-3">
          <pre className="text-[12px] m-muted m-mono">{JSON.stringify(stats, null, 2)}</pre>
        </Card>
      )}

      {/* Search + add */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2 m-sunken m-bd rounded-xl px-3 py-1.5 flex-1">
          <Search size={14} className="m-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories…" className="flex-1 bg-transparent outline-none text-[13px] m-ink" />
        </div>
        <button onClick={() => setAdding(true)} className="m-accent-bg rounded-xl px-3 py-1.5 text-[12px] font-medium m-press m-focus flex items-center gap-1">
          <Plus size={13} /> Add
        </button>
      </div>

      {adding && (
        <Card className="p-4 space-y-3">
          <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)}
            placeholder="Content to remember…" rows={3}
            className="w-full m-sunken m-bd rounded-xl p-3 text-[13px] m-ink resize-none outline-none" />
          <div className="flex gap-2">
            <button onClick={addMemory} className="m-accent-bg rounded-xl px-3 py-1.5 text-[12px] font-medium m-press m-focus">Save</button>
            <button onClick={() => setAdding(false)} className="m-press m-focus rounded-xl px-3 py-1.5 text-[12px] m-muted">Cancel</button>
          </div>
        </Card>
      )}

      {/* Memories list */}
      {loading ? (
        <Card><div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={52} />)}</div></Card>
      ) : memories.length === 0 ? (
        <Card><div className="p-6 text-center text-sm m-muted">No memories in this workspace.</div></Card>
      ) : (
        <Card className="divide-y divide-[var(--border)] overflow-hidden">
          {memories
            .filter((m) => !query || m.content.toLowerCase().includes(query.toLowerCase()))
            .map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="text-sm m-ink">{m.content}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{m.memory_type}</span>
                  {m.author && <span className="text-[11px] m-muted">by {m.author}</span>}
                </div>
              </div>
              <button onClick={() => removeMemory(m.id)} disabled={deletePending[m.id]}
                className="m-press m-focus p-1.5 rounded-lg" style={{ color: "#EF4444" }}>
                {deletePending[m.id] ? "…" : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
