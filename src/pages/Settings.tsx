import { useEffect, useState } from 'react'
import { Save, Eye, EyeOff, Shield, Cpu, DollarSign, Bell, Globe, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import i18n from '@/i18n/config'

type Tab = "api_keys"|"agent"|"budget"|"notifications"|"language"|"appearance"

const tabs = [
  {id:"api_keys" as Tab,label:"API Keys",icon:Shield},
  {id:"agent" as Tab,label:"Agent",icon:Cpu},
  {id:"budget" as Tab,label:"Budget",icon:DollarSign},
  {id:"notifications" as Tab,label:"Notifications",icon:Bell},
  {id:"language" as Tab,label:"Language",icon:Globe},
  {id:"appearance" as Tab,label:"Appearance",icon:Palette},
]

const providers = [
  {key:"GROQ_KEY",label:"Groq",free:true,link:"console.groq.com"},
  {key:"GEMINI_KEY",label:"Google Gemini",free:true,link:"aistudio.google.com"},
  {key:"OPENAI_KEY",label:"OpenAI",free:false,link:"platform.openai.com"},
  {key:"ANTHROPIC_KEY",label:"Anthropic Claude",free:false,link:"console.anthropic.com"},
  {key:"DEEPSEEK_KEY",label:"DeepSeek",free:false,link:"platform.deepseek.com"},
]

interface SettingsState {
  keys: Record<string, string>
  approvalMode: string
  maxSteps: string
  maxTokens: string
  timeout: string
  logLevel: string
  budget: string
  alerts: Record<string, boolean>
  notifyTaskDone: boolean
  notifyBudget: boolean
  language: string
  accentColor: string
}

const DEFAULTS: SettingsState = {
  keys: {}, approvalMode: "auto", maxSteps: "25", maxTokens: "8000",
  timeout: "60", logLevel: "INFO", budget: "1.0",
  alerts: { "50%": false, "80%": true, "90%": false, "100%": false },
  notifyTaskDone: true, notifyBudget: true, language: "en", accentColor: "#7c6af7",
}

function loadSettings(): SettingsState {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('maya_settings') || '{}') } }
  catch { return DEFAULTS }
}

function ApiKeyRow({provider, value, onChange}: {provider: typeof providers[0]; value: string; onChange: (v: string) => void}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-3 p-4 bg-[#1a1d2e] rounded-xl border border-[#1e2130]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">{provider.label}</span>
          {provider.free && <span className="badge-green">Free</span>}
        </div>
        <a href={`https://${provider.link}`} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:underline">{provider.link}</a>
      </div>
      <div className="flex items-center gap-2 w-64">
        <div className="relative flex-1">
          <input type={show?"text":"password"} value={value} onChange={e=>onChange(e.target.value)}
            placeholder={`Enter ${provider.key}...`} className="input pr-10 font-mono text-xs"/>
          <button onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            {show ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
          </button>
        </div>
        <span className={value?"badge-green":"badge-default"}>{value?"Set":"Not set"}</span>
      </div>
    </div>
  )
}

export function Settings() {
  const [tab, setTab] = useState<Tab>("api_keys")
  const [s, setS] = useState<SettingsState>(loadSettings)
  const [dirty, setDirty] = useState(false)

  const update = (patch: Partial<SettingsState>) => { setS(prev => ({ ...prev, ...patch })); setDirty(true) }

  const save = () => {
    localStorage.setItem('maya_settings', JSON.stringify(s))
    setDirty(false)
    toast.success('Settings saved')
  }

  // warn about unsaved changes on tab close
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configure Maya 2.0 ULTRA</p>
        </div>
        <button onClick={save} className={cn("btn-primary", !dirty && "opacity-60")}>
          <Save className="w-4 h-4"/>{dirty ? 'Save Changes' : 'Saved'}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-44 flex-shrink-0 space-y-1">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",tab===t.id?"sidebar-item-active":"sidebar-item")}>
              <t.icon className="w-4 h-4"/>{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          {tab==="api_keys" && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">API Keys</h3>
              <div className="space-y-3">
                {providers.map(p=>(
                  <ApiKeyRow key={p.key} provider={p} value={s.keys[p.key] || ''}
                    onChange={v => update({ keys: { ...s.keys, [p.key]: v } })}/>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
                ⚠️ Keys are stored only in this browser. The backend reads its own keys from server environment variables (Render dashboard).
              </div>
            </div>
          )}

          {tab==="agent" && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Agent Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-2">Approval Mode</label>
                  <div className="flex gap-2">
                    {["auto","human","skip"].map(m=>(
                      <button key={m} onClick={()=>update({approvalMode:m})}
                        className={cn("flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all border",
                          s.approvalMode===m?"bg-purple-500/20 border-purple-500/40 text-purple-400":"border-[#1e2130] text-slate-500 hover:text-white")}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {([["Max Steps","maxSteps"],["Max Tokens","maxTokens"],["Timeout (s)","timeout"],["Log Level","logLevel"]] as const).map(([label,field])=>(
                    <div key={field}>
                      <label className="text-xs font-medium text-slate-400 block mb-1">{label}</label>
                      <input value={s[field]} onChange={e=>update({[field]: e.target.value} as any)} className="input text-sm"/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==="budget" && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Budget & Cost Control</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Session Budget (USD)</label>
                  <input value={s.budget} onChange={e=>update({budget:e.target.value})} type="number" min="0" step="0.1" className="input text-sm"/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Alert at</label>
                  {Object.keys(s.alerts).map(v=>(
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={s.alerts[v]}
                        onChange={e=>update({alerts:{...s.alerts,[v]:e.target.checked}})}
                        className="accent-purple-500"/>
                      <span className="text-sm text-slate-400">{v} of budget</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500">Note: the enforced budget cap is set by BUDGET_USD on the server; this controls client-side alerts.</p>
              </div>
            </div>
          )}

          {tab==="notifications" && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Notifications</h3>
              <div className="space-y-3">
                {([["Task completed / failed","notifyTaskDone"],["Budget alerts","notifyBudget"]] as const).map(([label,field])=>(
                  <label key={field} className="flex items-center justify-between cursor-pointer p-3 bg-[#1a1d2e] rounded-lg">
                    <span className="text-sm text-slate-300">{label}</span>
                    <input type="checkbox" checked={s[field]} onChange={e=>update({[field]:e.target.checked} as any)} className="accent-purple-500 w-4 h-4"/>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab==="language" && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Language</h3>
              <div className="flex gap-2">
                {([["en","English"],["bn","বাংলা"]] as const).map(([code,label])=>(
                  <button key={code} onClick={()=>{update({language:code}); i18n.changeLanguage(code)}}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border",
                      s.language===code?"bg-purple-500/20 border-purple-500/40 text-purple-400":"border-[#1e2130] text-slate-500 hover:text-white")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab==="appearance" && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Appearance</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-2">Theme</label>
                  <div className="flex gap-2">
                    {["dark"].map(t=>(
                      <button key={t} className="flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all border bg-purple-500/20 border-purple-500/40 text-purple-400">
                        {t} (only theme available)
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-2">Accent Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {["#7c6af7","#38bdf8","#34d399","#f87171","#fbbf24","#fb923c"].map(c=>(
                      <button key={c} onClick={()=>update({accentColor:c})}
                        className={cn("w-8 h-8 rounded-full transition-all",s.accentColor===c&&"ring-2 ring-white ring-offset-2 ring-offset-[#0a0b0f]")}
                        style={{background:c}}/>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
