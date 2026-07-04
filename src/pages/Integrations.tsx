import { useEffect, useState } from 'react'
import { Globe, Plus, Webhook, Key, CheckCircle2, XCircle, Trash2, Copy } from 'lucide-react'
import { adminAPI, webhookAPI } from '@/lib/api'
import toast from 'react-hot-toast'

// App connections are client-side preferences (no backend integration endpoints yet).
// They persist in localStorage so toggles survive restarts.
const defaultApps = [
  {id:1,name:"GitHub",description:"Code repositories and PR automation",connected:false,category:"Developer"},
  {id:2,name:"Slack",description:"Team messaging and notifications",connected:false,category:"Communication"},
  {id:3,name:"Notion",description:"Notes and database management",connected:false,category:"Productivity"},
  {id:4,name:"Google Drive",description:"File storage and documents",connected:false,category:"Storage"},
  {id:5,name:"Zapier",description:"Workflow automation",connected:false,category:"Automation"},
  {id:6,name:"Discord",description:"Community and notifications",connected:false,category:"Communication"},
]

interface WebhookRow { id: string; name: string; url: string; events: string[]; active: boolean }
interface ApiKeyRow { id?: string; name?: string; prefix?: string; created_at?: string; [k: string]: unknown }

export function Integrations() {
  const [integrations, setIntegrations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('maya_integrations') || '') || defaultApps }
    catch { return defaultApps }
  })
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([])
  const [addingWebhook, setAddingWebhook] = useState(false)
  const [whName, setWhName] = useState('')
  const [whUrl, setWhUrl] = useState('')

  useEffect(() => { localStorage.setItem('maya_integrations', JSON.stringify(integrations)) }, [integrations])

  const fetchWebhooks = () => {
    webhookAPI.list().then((d: any) => setWebhooks(d?.webhooks || [])).catch(() => setWebhooks([]))
  }
  useEffect(() => { fetchWebhooks() }, [])

  const fetchKeys = () => {
    adminAPI.apiKeys().then((d: any) => setApiKeys(d?.keys || (Array.isArray(d) ? d : []))).catch(() => setApiKeys([]))
  }
  useEffect(() => { fetchKeys() }, [])

  const toggle = (id: number) =>
    setIntegrations((prev: typeof defaultApps) => prev.map(a => a.id === id ? { ...a, connected: !a.connected } : a))

  const addWebhook = async () => {
    if (!whName.trim() || !whUrl.trim()) return toast.error('Name and URL are required')
    try { new URL(whUrl) } catch { return toast.error('Enter a valid URL') }
    try {
      await webhookAPI.create(whName.trim(), whUrl.trim(), ['task.started', 'task.done', 'task.failed'])
      setWhName(''); setWhUrl(''); setAddingWebhook(false)
      toast.success('Webhook saved')
      fetchWebhooks()
    } catch { toast.error('Failed to save webhook') }
  }

  const deleteWebhook = async (id: string) => {
    try {
      await webhookAPI.delete(id)
      setWebhooks(prev => prev.filter(w => w.id !== id))
      toast.success('Webhook deleted')
    } catch { toast.error('Delete failed') }
  }

  const toggleWebhook = async (id: string) => {
    const wh = webhooks.find(w => w.id === id)
    if (!wh) return
    try {
      await webhookAPI.update(id, { active: !wh.active })
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w))
    } catch { toast.error('Update failed') }
  }

  const generateKey = async () => {
    try {
      const res: any = await adminAPI.createApiKey({ name: `key-${Date.now().toString(36)}` })
      toast.success('API key created')
      if (res?.key || res?.secret) {
        navigator.clipboard?.writeText(res.key || res.secret).catch(() => {})
        toast('Key copied to clipboard — store it safely, it is shown once.', { icon: '🔑' })
      }
      fetchKeys()
    } catch { toast.error('Failed to create key — is the enterprise layer active?') }
  }

  const revokeKey = async (id?: string) => {
    if (!id) return
    try {
      await adminAPI.revokeApiKey(id)
      toast.success('Key revoked')
      fetchKeys()
    } catch { toast.error('Failed to revoke key') }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Integrations</h1>
          <p className="text-sm text-slate-400 mt-0.5">{integrations.filter((a: any)=>a.connected).length} connected</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">App Connections <span className="text-xs text-slate-500 font-normal">(saved on this device)</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((app: any)=>(
            <div key={app.id} className="card-hover p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a1d2e] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-slate-500"/>
                </div>
                {app.connected ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : <XCircle className="w-4 h-4 text-slate-600 opacity-30"/>}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{app.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{app.description}</p>
              <div className="flex items-center justify-between">
                <span className="badge-default">{app.category}</span>
                <button onClick={()=>toggle(app.id)} className={app.connected?"bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-lg transition-all":"btn-secondary text-xs py-1.5 px-3"}>
                  {app.connected?"Disconnect":"Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Webhooks <span className="text-xs text-slate-500 font-normal">(fired by backend on task events)</span></h2>
          <button onClick={() => setAddingWebhook(true)} className="btn-secondary text-xs py-1.5 px-3"><Plus className="w-3.5 h-3.5"/>Add Webhook</button>
        </div>
        {addingWebhook && (
          <div className="card p-4 mb-3 space-y-2">
            <input value={whName} onChange={e=>setWhName(e.target.value)} placeholder="Webhook name..." className="input"/>
            <input value={whUrl} onChange={e=>setWhUrl(e.target.value)} placeholder="https://hooks.example.com/..." className="input font-mono text-xs"/>
            <div className="flex gap-2">
              <button onClick={addWebhook} className="btn-primary text-xs py-1.5">Save Webhook</button>
              <button onClick={()=>setAddingWebhook(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
            </div>
          </div>
        )}
        {webhooks.length === 0 && !addingWebhook ? (
          <div className="card p-6 text-center text-xs text-slate-500">No webhooks configured yet.</div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(w=>(
              <div key={w.id} className="card-hover p-4">
                <div className="flex items-start gap-3">
                  <Webhook className="w-4 h-4 text-purple-400 mt-0.5"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{w.name}</span>
                      <button onClick={()=>toggleWebhook(w.id)} className={w.active?"badge-green":"badge-default"}>{w.active?"Active":"Inactive"}</button>
                    </div>
                    <div className="text-xs font-mono text-slate-500 truncate">{w.url}</div>
                    <div className="flex gap-1 mt-2">{w.events.map(e=><span key={e} className="badge-purple font-mono text-[10px]">{e}</span>)}</div>
                  </div>
                  <button onClick={()=>deleteWebhook(w.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">API Keys <span className="text-xs text-slate-500 font-normal">(managed by backend)</span></h2>
          <button onClick={generateKey} className="btn-secondary text-xs py-1.5 px-3"><Key className="w-3.5 h-3.5"/>Generate Key</button>
        </div>
        {apiKeys.length === 0 ? (
          <div className="card p-6 text-center text-xs text-slate-500">No API keys yet. Generate one to access Maya programmatically.</div>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((k, i) => (
              <div key={k.id || i} className="card p-4 flex items-center gap-3">
                <Key className="w-4 h-4 text-yellow-400"/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{k.name || 'API Key'}</div>
                  <div className="text-xs font-mono text-slate-500">{k.prefix ? `${k.prefix}••••••••` : String(k.id || '').slice(0, 12)}</div>
                </div>
                {k.created_at && <span className="text-xs text-slate-500">{String(k.created_at).slice(0,10)}</span>}
                <button onClick={()=>revokeKey(k.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
