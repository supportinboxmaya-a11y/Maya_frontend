import { useEffect, useState } from "react"
import { Building2, RefreshCw, Users, KeyRound, ScrollText, Ban, CheckCircle2, Trash2, Plus, Crown, Shield, User, X } from "lucide-react"
import { Card, Skeleton } from "@/components/maya/ui"
import { adminAPI } from "@/lib/api"
import toast from "react-hot-toast"

interface MayaUser {
  id: string; email: string; name?: string; role: string
  budget_usd: number; budget_used_usd: number; banned: boolean; created_at?: string
}

interface Org { id: string; name: string; [k: string]: unknown }
interface ApiKey { id: string; name?: string; key?: string }
interface AuditEntry { action?: string; ts?: string; [k: string]: unknown }

const ROLE_ICONS: Record<string, typeof Crown> = {
  admin: Crown, owner: Crown, developer: Shield, manager: Shield, member: User, user: User, viewer: User,
}

export function OrgPanel() {
  // Users
  const [users, setUsers] = useState<MayaUser[]>([])
  const [usersEnabled, setUsersEnabled] = useState(true)
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({})
  const [banPending, setBanPending] = useState<Record<string, boolean>>({})
  const [budgetPending, setBudgetPending] = useState<Record<string, boolean>>({})

  // Orgs
  const [orgs, setOrgs] = useState<Org[]>([])
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [deletePending, setDeletePending] = useState<Record<string, boolean>>({})

  // API Keys
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [revokePending, setRevokePending] = useState<Record<string, boolean>>({})

  // Audit
  const [audit, setAudit] = useState<AuditEntry[]>([])

  // General
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"users" | "orgs" | "keys" | "audit">("users")

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [o, k, a, u] = await Promise.allSettled([
        adminAPI.orgs(), adminAPI.apiKeys(), adminAPI.audit(), adminAPI.users(),
      ])
      if (o.status === "fulfilled") {
        const d = o.value as any
        setOrgs(d?.orgs || [])
      }
      if (k.status === "fulfilled") {
        const d = k.value as any
        setKeys(d?.keys || [])
      }
      if (a.status === "fulfilled") {
        const d = a.value as any
        setAudit(d?.entries || d?.audit || (Array.isArray(d) ? d : []))
      }
      if (u.status === "fulfilled") {
        const d = u.value as any
        setUsersEnabled(d?.enabled !== false)
        setUsers(d?.users || [])
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // ── Users ──
  const toggleBan = async (u: MayaUser) => {
    setBanPending((p) => ({ ...p, [u.id]: true }))
    try {
      await adminAPI.banUser(u.id, !u.banned)
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, banned: !u.banned } : x)))
      toast.success(u.banned ? "User unbanned" : "User banned")
    } catch {
      toast.error("Could not update user")
    }
    setBanPending((p) => ({ ...p, [u.id]: false }))
  }

  const saveBudget = async (u: MayaUser) => {
    const raw = budgetDraft[u.id]
    if (raw === undefined) return
    const value = parseFloat(raw)
    if (Number.isNaN(value) || value < 0) { toast.error("Enter a valid budget"); return }
    setBudgetPending((p) => ({ ...p, [u.id]: true }))
    try {
      await adminAPI.setUserBudget(u.id, value)
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, budget_usd: value } : x)))
      setBudgetDraft((b) => ({ ...b, [u.id]: "" }))
      toast.success("Budget updated")
    } catch {
      toast.error("Could not update budget")
    }
    setBudgetPending((p) => ({ ...p, [u.id]: false }))
  }

  // ── Orgs ──
  const createOrg = async () => {
    if (!orgName.trim()) return toast.error("Name required")
    try {
      await adminAPI.createOrg(orgName.trim())
      toast.success("Organization created")
      setOrgName("")
      setShowCreateOrg(false)
      fetchAll()
    } catch {
      toast.error("Failed to create")
    }
  }

  const deleteOrg = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Irreversible.`)) return
    setDeletePending((p) => ({ ...p, [id]: true }))
    try {
      await adminAPI.deleteOrg(id)
      setOrgs((prev) => prev.filter((o) => o.id !== id))
      toast.success("Deleted")
    } catch {
      toast.error("Delete failed")
    }
    setDeletePending((p) => ({ ...p, [id]: false }))
  }

  // ── API Keys ──
  const revokeKey = async (id: string) => {
    if (!confirm("Revoke this key? Anything using it stops immediately.")) return
    setRevokePending((p) => ({ ...p, [id]: true }))
    try {
      await adminAPI.revokeApiKey(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
      toast.success("Key revoked")
    } catch {
      toast.error("Revoke failed")
    }
    setRevokePending((p) => ({ ...p, [id]: false }))
  }

  const tabs = [
    { id: "users" as const, label: "Users", count: users.length, icon: Users },
    { id: "orgs" as const, label: "Orgs", count: orgs.length, icon: Building2 },
    { id: "keys" as const, label: "API Keys", count: keys.length, icon: KeyRound },
    { id: "audit" as const, label: "Audit", count: audit.length, icon: ScrollText },
  ]

  return (
    <div className="space-y-6">
      {/* Sub-tabs for org sections */}
      <div className="flex gap-1 overflow-x-auto m-hide-sb pb-1" style={{ scrollbarWidth: "none" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-on={tab === t.id}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap m-focus transition-colors"
            style={{
              background: tab === t.id ? "var(--accent-soft)" : "transparent",
              color: tab === t.id ? "var(--accent)" : "var(--muted)",
            }}
          >
            <t.icon size={14} />
            <span>{t.label}</span>
            <span className="text-[11px] opacity-60">{t.count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={fetchAll} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <Card><div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={52} />)}</div></Card>
      ) : (
        <>
          {/* ═══ Users ═══ */}
          {tab === "users" && (
            <div>
              {!usersEnabled ? (
                <Card><div className="p-6 text-sm m-muted">Multi-user not set up. Run Supabase schema and set environment variables.</div></Card>
              ) : users.length === 0 ? (
                <Card><div className="p-6 text-center text-sm m-muted">No users yet.</div></Card>
              ) : (
                <Card className="divide-y divide-[var(--border)] overflow-hidden">
                  {users.map((u) => {
                    const RoleIcon = ROLE_ICONS[u.role] || User
                    return (
                      <div key={u.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <RoleIcon size={16} className="m-accent flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium m-ink truncate">{u.name || u.email}</div>
                              <div className="text-[11px] m-muted truncate">{u.email} · {u.role}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleBan(u)}
                            disabled={banPending[u.id]}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium m-press m-focus flex-shrink-0"
                            style={{
                              background: u.banned ? "rgba(239,68,68,.12)" : "var(--sunken)",
                              color: u.banned ? "#EF4444" : "var(--muted)",
                            }}
                          >
                            {u.banned ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                            {u.banned ? "Banned" : "Active"}
                          </button>
                        </div>
                        {/* Budget bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full m-sunken overflow-hidden">
                            <div className="h-full" style={{ width: `${Math.min(100, (u.budget_used_usd / (u.budget_usd || 1)) * 100)}%`, background: "var(--accent)" }} />
                          </div>
                          <span className="text-[11px] m-mono m-muted whitespace-nowrap">${u.budget_used_usd?.toFixed(2)} / ${u.budget_usd?.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number" step="0.5" placeholder="New budget ($)"
                            value={budgetDraft[u.id] ?? ""}
                            onChange={(e) => setBudgetDraft((b) => ({ ...b, [u.id]: e.target.value }))}
                            className="flex-1 m-sunken m-bd rounded-xl px-3 py-1.5 text-[13px] m-ink outline-none placeholder:text-[var(--faint)]"
                          />
                          <button
                            onClick={() => saveBudget(u)}
                            disabled={!budgetDraft[u.id]?.trim() || budgetPending[u.id]}
                            className="m-accent-bg rounded-xl px-3 py-1.5 text-[12px] font-medium m-press m-focus"
                          >
                            {budgetPending[u.id] ? "…" : "Set"}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </Card>
              )}
            </div>
          )}

          {/* ═══ Orgs ═══ */}
          {tab === "orgs" && (
            <div>
              <div className="flex items-center justify-end mb-3">
                <button onClick={() => setShowCreateOrg(true)} className="flex items-center gap-1.5 m-accent-bg rounded-xl px-3 py-1.5 text-[12px] font-medium m-press m-focus">
                  <Plus size={13} /> New Org
                </button>
              </div>
              {showCreateOrg && (
                <Card className="p-4 mb-3 flex items-center gap-2">
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createOrg() }}
                    placeholder="Organization name"
                    className="flex-1 m-sunken m-bd rounded-xl px-3 py-1.5 text-[13px] m-ink outline-none placeholder:text-[var(--faint)]"
                  />
                  <button onClick={createOrg} className="m-accent-bg rounded-xl px-3 py-1.5 text-[12px] font-medium m-press m-focus">Create</button>
                  <button onClick={() => setShowCreateOrg(false)} className="m-press m-focus p-1.5 rounded-xl m-muted"><X size={15} /></button>
                </Card>
              )}
              {orgs.length === 0 ? (
                <Card><div className="p-6 text-center text-sm m-muted">No organizations yet.</div></Card>
              ) : (
                <Card className="divide-y divide-[var(--border)] overflow-hidden">
                  {orgs.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium m-ink truncate">{o.name}</div>
                        <div className="text-[11px] m-mono m-muted truncate">{o.id}</div>
                      </div>
                      <button
                        onClick={() => deleteOrg(o.id, o.name)}
                        disabled={deletePending[o.id]}
                        className="m-press m-focus p-1.5 rounded-lg"
                        style={{ color: "#EF4444" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* ═══ API Keys ═══ */}
          {tab === "keys" && (
            <div>
              {keys.length === 0 ? (
                <Card><div className="p-6 text-center text-sm m-muted">No API keys. Generate from Integrations.</div></Card>
              ) : (
                <Card className="divide-y divide-[var(--border)] overflow-hidden">
                  {keys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="text-sm font-medium m-ink truncate">{k.name || "API Key"}</div>
                        {k.key && <div className="text-[11px] m-mono m-muted truncate">{k.key.slice(0, 20)}…</div>}
                      </div>
                      <button
                        onClick={() => revokeKey(k.id)}
                        disabled={revokePending[k.id]}
                        className="m-press m-focus p-1.5 rounded-lg"
                        style={{ color: "#EF4444" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* ═══ Audit ═══ */}
          {tab === "audit" && (
            <div>
              {audit.length === 0 ? (
                <Card><div className="p-6 text-center text-sm m-muted">No audit entries yet.</div></Card>
              ) : (
                <Card className="divide-y divide-[var(--border)] overflow-hidden max-h-[480px] overflow-y-auto">
                  {audit.map((l, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="text-sm m-ink">{l.action || JSON.stringify(l)}</div>
                      {l.ts && <div className="text-[11px] m-muted mt-0.5">{String(l.ts).slice(0, 19)}</div>}
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
