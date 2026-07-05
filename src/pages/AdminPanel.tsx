import { useEffect, useState } from 'react'
import { adminAPI, systemAPI, api } from '@/lib/api'
import { ShieldCheck, RefreshCw, Loader2, Ban, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

type MayaUser = {
  id: string; email: string; name?: string; role: string
  budget_usd: number; budget_used_usd: number; banned: boolean; created_at?: string
}

export function AdminPanel() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [keys, setKeys] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [users, setUsers] = useState<MayaUser[]>([])
  const [usersEnabled, setUsersEnabled] = useState(true)
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    const [o, k, a, f, u] = await Promise.allSettled([
      adminAPI.orgs(), adminAPI.apiKeys(), adminAPI.audit(), systemAPI.flags(), adminAPI.users()])
    if (o.status === 'fulfilled') setOrgs((o.value as any)?.orgs || [])
    if (k.status === 'fulfilled') setKeys((k.value as any)?.keys || [])
    if (a.status === 'fulfilled') { const v: any = a.value; setAudit(v?.entries || v?.audit || (Array.isArray(v) ? v : [])) }
    if (f.status === 'fulfilled') setFlags((f.value as any) || {})
    if (u.status === 'fulfilled') {
      const v: any = u.value
      setUsersEnabled(v?.enabled !== false)
      setUsers(v?.users || [])
    }
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const toggleFlag = async (name: string) => {
    try {
      const res: any = await api.put('/flags', { name, value: !flags[name] })
      setFlags(res?.flags || { ...flags, [name]: !flags[name] })
      toast.success('Flag updated')
    } catch { toast.error('Flag update failed') }
  }

  const toggleBan = async (u: MayaUser) => {
    try {
      await adminAPI.banUser(u.id, !u.banned)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, banned: !u.banned } : x))
      toast.success(u.banned ? 'User unbanned' : 'User banned')
    } catch { toast.error('Could not update user') }
  }

  const saveBudget = async (u: MayaUser) => {
    const raw = budgetDraft[u.id]
    if (raw === undefined) return
    const value = parseFloat(raw)
    if (Number.isNaN(value) || value < 0) { toast.error('Enter a valid budget'); return }
    try {
      await adminAPI.setUserBudget(u.id, value)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, budget_usd: value } : x))
      toast.success('Budget updated')
    } catch { toast.error('Could not update budget') }
  }

  return (
    <div className="p-5 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple-400"/>Admin Panel</h1>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div> : (
        <>
          <section>
            <div className="section-title">Users {usersEnabled ? `(${users.length})` : ''}</div>
            <div className="card divide-y divide-[#262b3f]">
              {!usersEnabled ? (
                <div className="p-5 text-sm text-slate-500">
                  Multi-user isn't set up yet. Run <code className="text-purple-400">supabase/schema.sql</code> in
                  your Supabase project, then set <code className="text-purple-400">SUPABASE_URL</code> and{' '}
                  <code className="text-purple-400">SUPABASE_SERVICE_KEY</code> in the backend's env vars.
                </div>
              ) : users.length === 0 ? (
                <div className="p-5 text-sm text-slate-500">No users yet.</div>
              ) : users.map(u => (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[15px] text-white truncate">{u.name || u.email}</div>
                      <div className="text-xs text-slate-500 truncate">{u.email} · {u.role}</div>
                    </div>
                    <button onClick={() => toggleBan(u)}
                      className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${u.banned ? 'bg-red-500/15 text-red-400' : 'bg-[#1e2130] text-slate-300 hover:text-white'}`}>
                      {u.banned ? <><Ban className="w-3.5 h-3.5"/>Banned</> : <><CheckCircle2 className="w-3.5 h-3.5"/>Active</>}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#1e2130] overflow-hidden">
                      <div className="h-full bg-purple-500" style={{width: `${Math.min(100, (u.budget_used_usd / (u.budget_usd || 1)) * 100)}%`}}/>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">${u.budget_used_usd?.toFixed(2)} / ${u.budget_usd?.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" step="0.5" placeholder="New budget ($)"
                      value={budgetDraft[u.id] ?? ''}
                      onChange={e => setBudgetDraft(prev => ({ ...prev, [u.id]: e.target.value }))}
                      className="input text-sm flex-1"/>
                    <button onClick={() => saveBudget(u)} className="btn-secondary text-xs px-3">Set</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="section-title">Feature Flags</div>
            <div className="card divide-y divide-[#262b3f]">
              {Object.keys(flags).length === 0 ? <div className="p-5 text-sm text-slate-500">No flags reported.</div> :
                Object.entries(flags).map(([name, on]) => (
                  <div key={name} className="flex items-center justify-between p-4">
                    <span className="text-[15px] font-mono text-slate-200">{name}</span>
                    <button onClick={() => toggleFlag(name)} className={`w-14 h-8 rounded-full relative transition-colors ${on ? 'bg-purple-600' : 'bg-[#262b3f]'}`}>
                      <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${on ? 'left-7' : 'left-1'}`}/>
                    </button>
                  </div>))}
            </div>
          </section>
          <section>
            <div className="section-title">Organizations ({orgs.length})</div>
            <div className="card divide-y divide-[#262b3f]">
              {orgs.length === 0 ? <div className="p-5 text-sm text-slate-500">No organizations yet.</div> :
                orgs.map((o: any) => <div key={o.id} className="p-4 flex justify-between"><span className="text-white text-[15px]">{o.name}</span><span className="text-xs text-slate-500 font-mono">{o.id}</span></div>)}
            </div>
          </section>
          <section>
            <div className="section-title">API Keys ({keys.length})</div>
            <div className="card divide-y divide-[#262b3f]">
              {keys.length === 0 ? <div className="p-5 text-sm text-slate-500">No keys. Generate from Integrations.</div> :
                keys.map((k: any, i) => <div key={i} className="p-4 text-[15px] text-white">{k.name || 'API Key'}</div>)}
            </div>
          </section>
          <section>
            <div className="section-title">Audit Trail</div>
            <div className="card divide-y divide-[#262b3f] max-h-96 overflow-y-auto">
              {audit.length === 0 ? <div className="p-5 text-sm text-slate-500">No entries yet.</div> :
                audit.map((l: any, i) => <div key={i} className="p-4"><div className="text-[15px] text-white">{l.action || JSON.stringify(l)}</div>{l.ts && <div className="text-xs text-slate-500 mt-0.5">{String(l.ts).slice(0,19)}</div>}</div>)}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
