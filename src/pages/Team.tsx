import { useEffect, useState } from 'react'
import { Users, Plus, Crown, Shield, User, Activity, Loader2, RefreshCw, Trash2, UsersRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminAPI, taskAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const roleConfig = {
  admin:{icon:Crown,badge:"badge-yellow",label:"Admin"},
  owner:{icon:Crown,badge:"badge-yellow",label:"Owner"},
  developer:{icon:Shield,badge:"badge-purple",label:"Developer"},
  manager:{icon:Shield,badge:"badge-purple",label:"Manager"},
  member:{icon:User,badge:"badge-blue",label:"Member"},
  user:{icon:User,badge:"badge-blue",label:"User"},
  viewer:{icon:User,badge:"badge-default",label:"Viewer"},
} as const

interface Org { id: string; name: string; [k: string]: unknown }
interface OrgTeam { id: string; org_id: string; name: string }
interface OrgMember { email: string; org_id: string; team_id: string | null; role: string }

export function Team() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [activeOrg, setActiveOrg] = useState<string | null>(null)
  const [teams, setTeams] = useState<OrgTeam[]>([])
  const [members, setMembers] = useState<OrgMember[]>([])
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [orgDetailLoading, setOrgDetailLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [addingTeam, setAddingTeam] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('viewer')

  const fetchOrgs = async () => {
    setLoading(true)
    try {
      const [o, t] = await Promise.allSettled([adminAPI.orgs(), taskAPI.list({ limit: 5 })])
      let orgList: Org[] = []
      if (o.status === 'fulfilled') orgList = ((o.value as any)?.orgs) || []
      setOrgs(orgList)
      if (orgList.length && !orgList.find(x => x.id === activeOrg)) setActiveOrg(orgList[0].id)
      if (t.status === 'fulfilled' && Array.isArray(t.value)) setRecentTasks(t.value as any[])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOrgs() }, [])

  const fetchOrgDetail = async () => {
    if (!activeOrg) { setTeams([]); setMembers([]); return }
    setOrgDetailLoading(true)
    try {
      const [t, m] = await Promise.allSettled([adminAPI.teams(activeOrg), adminAPI.orgMembers(activeOrg)])
      setTeams(t.status === 'fulfilled' ? ((t.value as any)?.teams || []) : [])
      setMembers(m.status === 'fulfilled' ? ((m.value as any)?.members || []) : [])
    } finally { setOrgDetailLoading(false) }
  }

  useEffect(() => { fetchOrgDetail() }, [activeOrg])

  const createOrg = async () => {
    if (!orgName.trim()) return toast.error('Organization name is required')
    try {
      const org: any = await adminAPI.createOrg(orgName.trim())
      toast.success('Organization created')
      setOrgName(''); setCreating(false)
      await fetchOrgs()
      if (org?.id) setActiveOrg(org.id)
    } catch { toast.error('Failed to create organization') }
  }

  const deleteOrg = async (id: string, name: string) => {
    if (!window.confirm(`Delete organization "${name}"? This removes all its teams and members.`)) return
    try {
      await adminAPI.deleteOrg(id)
      toast.success('Organization deleted')
      if (activeOrg === id) setActiveOrg(null)
      fetchOrgs()
    } catch { toast.error('Failed to delete — admin role required') }
  }

  const createTeam = async () => {
    if (!activeOrg || !teamName.trim()) return toast.error('Team name is required')
    try {
      await adminAPI.createTeam(activeOrg, teamName.trim())
      toast.success('Team created')
      setTeamName(''); setAddingTeam(false)
      fetchOrgDetail()
    } catch { toast.error('Failed to create team') }
  }

  const addMember = async () => {
    if (!activeOrg || !memberEmail.trim()) return toast.error('Email is required')
    try {
      await adminAPI.addMember(activeOrg, memberEmail.trim(), memberRole)
      toast.success('Member added')
      setMemberEmail(''); setMemberRole('viewer'); setAddingMember(false)
      fetchOrgDetail()
    } catch { toast.error('Failed to add member') }
  }

  const removeMember = async (email: string) => {
    if (!activeOrg) return
    try {
      await adminAPI.removeMember(activeOrg, email)
      setMembers(prev => prev.filter(m => m.email !== email))
      toast.success('Member removed')
    } catch { toast.error('Failed to remove — admin role required') }
  }

  const activeOrgObj = orgs.find(o => o.id === activeOrg)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Workspace</h1>
          <p className="text-sm text-slate-400 mt-0.5">{orgs.length} organization{orgs.length !== 1 && 's'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrgs} className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
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
      ) : orgs.length === 0 ? (
        <div className="card p-8 text-center">
          <Users className="w-8 h-8 text-slate-700 mx-auto mb-2"/>
          <p className="text-sm text-slate-500">No organizations yet. Create one to start collaborating.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 flex-wrap">
              {orgs.map(o => (
                <button key={o.id} onClick={() => setActiveOrg(o.id)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs border', activeOrg === o.id ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-[#14161e] text-slate-400 border-[#262b3f]')}>
                  {o.name}
                </button>
              ))}
            </div>

            {activeOrgObj && (
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">{activeOrgObj.name}</h2>
                <button onClick={() => deleteOrg(activeOrgObj.id, activeOrgObj.name)} className="text-slate-500 hover:text-red-400 transition-colors" aria-label="Delete organization">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            )}

            {orgDetailLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-purple-400"/></div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Teams ({teams.length})</h3>
                    <button onClick={() => setAddingTeam(true)} className="btn-secondary text-xs py-1 px-2"><Plus className="w-3 h-3"/>Team</button>
                  </div>
                  {addingTeam && (
                    <div className="card p-3 flex gap-2">
                      <input value={teamName} onChange={e => setTeamName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && createTeam()}
                        placeholder="Team name..." className="input flex-1 text-sm"/>
                      <button onClick={createTeam} className="btn-primary text-xs py-1.5 px-3">Add</button>
                      <button onClick={() => setAddingTeam(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                    </div>
                  )}
                  {teams.length === 0 ? (
                    <div className="text-xs text-slate-500 px-1">No teams in this org yet.</div>
                  ) : teams.map(t => (
                    <div key={t.id} className="card-hover p-3 flex items-center gap-3">
                      <UsersRound className="w-4 h-4 text-purple-400"/>
                      <span className="text-sm text-white">{t.name}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Members ({members.length})</h3>
                    <button onClick={() => setAddingMember(true)} className="btn-secondary text-xs py-1 px-2"><Plus className="w-3 h-3"/>Member</button>
                  </div>
                  {addingMember && (
                    <div className="card p-3 space-y-2">
                      <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addMember()}
                        placeholder="Email address..." className="input text-sm"/>
                      <select value={memberRole} onChange={e => setMemberRole(e.target.value)} className="input text-sm">
                        <option value="viewer">Viewer</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={addMember} className="btn-primary text-xs py-1.5 px-3">Add</button>
                        <button onClick={() => setAddingMember(false)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                      </div>
                    </div>
                  )}
                  {members.length === 0 ? (
                    <div className="text-xs text-slate-500 px-1">No members in this org yet.</div>
                  ) : members.map((m) => {
                    const role = roleConfig[(m.role as keyof typeof roleConfig)] || roleConfig.viewer
                    const RoleIcon = role.icon
                    return (
                      <div key={m.email} className="card-hover p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-sm font-bold text-purple-400 flex-shrink-0">
                          {m.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{m.email}</div>
                        </div>
                        <span className={cn("badge", role.badge)}><RoleIcon className="w-3 h-3"/>{role.label}</span>
                        <button onClick={() => removeMember(m.email)} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0" aria-label={`Remove ${m.email}`}>
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    )
                  })}
                </div>
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
