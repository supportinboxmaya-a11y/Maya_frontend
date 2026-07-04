import { useEffect, useState } from 'react'
import { Users, Plus, Crown, Shield, User, Activity, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminAPI, taskAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const roleConfig = {
  admin:{icon:Crown,badge:"badge-yellow",label:"Admin"},
  owner:{icon:Crown,badge:"badge-yellow",label:"Owner"},
  manager:{icon:Shield,badge:"badge-purple",label:"Manager"},
  member:{icon:User,badge:"badge-blue",label:"Member"},
  user:{icon:User,badge:"badge-blue",label:"User"},
} as const

interface Org { id: string; name: string; [k: string]: unknown }
interface Member { id?: string; email?: string; name?: string; role?: string; [k: string]: unknown }

export function Team() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [orgName, setOrgName] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [o, d, t] = await Promise.allSettled([
        adminAPI.orgs(), adminAPI.dashboard(), taskAPI.list({ limit: 5 }),
      ])
      if (o.status === 'fulfilled') setOrgs(((o.value as any)?.orgs) || [])
      if (d.status === 'fulfilled') {
        const dash = d.value as any
        setMembers(dash?.members || dash?.users || [])
      }
      if (t.status === 'fulfilled' && Array.isArray(t.value)) setRecentTasks(t.value as any[])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const createOrg = async () => {
    if (!orgName.trim()) return toast.error('Organization name is required')
    try {
      await adminAPI.createOrg(orgName.trim())
      toast.success('Organization created')
      setOrgName(''); setCreating(false)
      fetchAll()
    } catch { toast.error('Failed to create organization') }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Workspace</h1>
          <p className="text-sm text-slate-400 mt-0.5">{orgs.length} organization{orgs.length !== 1 && 's'} · {members.length} member{members.length !== 1 && 's'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
          <button onClick={() => setCreating(true)} className="btn-primary"><Plus className="w-4 h-4"/>New Organization</button>
        </div>
      </div>

      {creating && (
        <div className="card p-4 flex gap-2">
          <input value={orgName} onChange={e => setOrgName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createOrg()}
            placeholder="Organization name..." className="input flex-1"/>
          <button onClick={createOrg} className="btn-primary">Create</button>
          <button onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-white">Organizations & Members</h2>
            {orgs.length === 0 && members.length === 0 ? (
              <div className="card p-8 text-center">
                <Users className="w-8 h-8 text-slate-700 mx-auto mb-2"/>
                <p className="text-sm text-slate-500">No organizations yet. Create one to start collaborating.</p>
              </div>
            ) : (
              <>
                {orgs.map(o => (
                  <div key={o.id} className="card-hover p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-sm font-bold text-purple-400 flex-shrink-0">
                      {String(o.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{o.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{o.id}</div>
                    </div>
                  </div>
                ))}
                {members.map((m, i) => {
                  const role = roleConfig[(m.role as keyof typeof roleConfig)] || roleConfig.user
                  const RoleIcon = role.icon
                  return (
                    <div key={m.id || i} className="card-hover p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-sm font-bold text-purple-400 flex-shrink-0">
                        {String(m.name || m.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{m.name || m.email}</div>
                        {m.email && m.name && <div className="text-xs text-slate-500">{m.email}</div>}
                      </div>
                      <span className={cn("badge", role.badge)}><RoleIcon className="w-3 h-3"/>{role.label}</span>
                    </div>
                  )
                })}
              </>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Recent Tasks</h2>
            {recentTasks.length === 0 ? (
              <div className="card p-6 text-center text-xs text-slate-500">No tasks yet.</div>
            ) : recentTasks.map((t, i) => (
              <div key={t.id || i} className="card-hover p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Activity className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0"/>
                  <p className="text-xs text-white">{t.goal}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</span>
                  <span className={cn("badge", t.status === "done" ? "badge-green" : t.status === "running" ? "badge-blue" : t.status === "failed" ? "badge-red" : "badge-yellow")}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
