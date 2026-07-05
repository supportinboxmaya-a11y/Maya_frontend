import { useEffect, useState } from 'react'
import { adminAPI, systemAPI, api } from '@/lib/api'
import { ShieldCheck, RefreshCw, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function AdminPanel() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [keys, setKeys] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    const [o, k, a, f] = await Promise.allSettled([
      adminAPI.orgs(), adminAPI.apiKeys(), adminAPI.audit(), systemAPI.flags()])
    if (o.status === 'fulfilled') setOrgs((o.value as any)?.orgs || [])
    if (k.status === 'fulfilled') setKeys((k.value as any)?.keys || [])
    if (a.status === 'fulfilled') { const v: any = a.value; setAudit(v?.entries || v?.audit || (Array.isArray(v) ? v : [])) }
    if (f.status === 'fulfilled') setFlags((f.value as any) || {})
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

  return (
    <div className="p-5 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple-400"/>Admin Panel</h1>
        <button onClick={fetchAll} className="btn-secondary"><RefreshCw className="w-4 h-4"/></button>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div> : (
        <>
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
