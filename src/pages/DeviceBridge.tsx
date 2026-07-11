import { useEffect, useState } from 'react'
import { deviceAPI, getEffectiveBackendUrl } from '@/lib/api'
import { MonitorSmartphone, Plus, Trash2, Loader2, X, Copy, History, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

interface Device { id: string; name: string; paired_at: number; last_seen: number | null }

export function DeviceBridge() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showPair, setShowPair] = useState(false)
  const [pairName, setPairName] = useState('')
  const [pairing, setPairing] = useState(false)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [historyFor, setHistoryFor] = useState<Device | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const res: any = await deviceAPI.list()
      setDevices(res?.devices || [])
    } catch { toast.error('Failed to load devices') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDevices() }, [])

  const startPairing = async () => {
    setPairing(true)
    try {
      const res: any = await deviceAPI.pairStart(pairName.trim() || 'My computer')
      setPairingCode(res.pairing_code)
    } catch { toast.error('Failed to generate pairing code') }
    finally { setPairing(false) }
  }

  const revoke = async (id: string) => {
    if (!window.confirm('Revoke this device? It will immediately lose all access.')) return
    try {
      await deviceAPI.revoke(id)
      setDevices(prev => prev.filter(d => d.id !== id))
      toast.success('Revoked')
    } catch { toast.error('Failed to revoke') }
  }

  const openHistory = async (d: Device) => {
    setHistoryFor(d); setHistoryLoading(true)
    try {
      const res: any = await deviceAPI.history(d.id)
      setHistory(res?.commands || [])
    } catch { toast.error('Could not load history') }
    finally { setHistoryLoading(false) }
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    toast.success('Copied')
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-bold text-white flex items-center gap-2"><MonitorSmartphone className="w-5 h-5 text-purple-400"/>Device Bridge</h1>

      <div className="card p-4 flex gap-3 border-yellow-500/20 bg-yellow-500/5">
        <ShieldAlert className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-slate-400">
          Pairing a device lets Maya queue mouse/keyboard/screenshot commands for a small script running on
          <em> that computer</em> — for native desktop apps a browser can't reach. Nothing happens until you
          run the bridge script yourself, every command still needs your approval, and you can revoke access
          instantly below. Only pair a machine you're genuinely comfortable with Maya interacting with.
        </p>
      </div>

      <button onClick={() => { setShowPair(true); setPairingCode(null); setPairName('') }} className="btn-primary text-sm">
        <Plus className="w-4 h-4"/>Pair a New Device
      </button>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : devices.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">No devices paired yet.</div>
      ) : (
        <div className="space-y-2">
          {devices.map(d => (
            <div key={d.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white">{d.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{d.id}</div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {d.last_seen ? `Last seen ${new Date(d.last_seen * 1000).toLocaleString()}` : 'Never connected'}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openHistory(d)} className="text-slate-500 hover:text-blue-400" title="Command history"><History className="w-4 h-4"/></button>
                <button onClick={() => revoke(d.id)} className="text-slate-500 hover:text-red-400" title="Revoke"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPair && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPair(false)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Pair a Device</h3>
              <button onClick={() => setShowPair(false)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
            </div>

            {!pairingCode ? (
              <>
                <input value={pairName} onChange={e => setPairName(e.target.value)} placeholder="Name (e.g. My laptop)" className="input w-full"/>
                <button onClick={startPairing} disabled={pairing} className="btn-primary">
                  {pairing ? <Loader2 className="w-4 h-4 animate-spin"/> : null}Generate Pairing Code
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 mb-1">Pairing code (valid 10 minutes)</div>
                  <div className="text-2xl font-mono font-bold text-purple-300 tracking-widest">{pairingCode}</div>
                </div>
                <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
                  <li>On the computer you want to pair, download <code className="text-purple-400">tools/bridge/maya_bridge_agent.py</code> from the repo.</li>
                  <li>Install dependencies: <code className="text-purple-400">pip install requests pyautogui pillow</code></li>
                  <li>Run: <code className="text-purple-400">python maya_bridge_agent.py</code></li>
                  <li>When prompted, enter the backend URL and this code.</li>
                </ol>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg px-2 py-1.5 flex-1 truncate">{getEffectiveBackendUrl()}</code>
                  <button onClick={() => copy(getEffectiveBackendUrl())} className="btn-secondary text-xs py-1.5 px-2"><Copy className="w-3.5 h-3.5"/></button>
                </div>
                <button onClick={() => { setShowPair(false); fetchDevices() }} className="btn-secondary w-full">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setHistoryFor(null)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white truncate">{historyFor.name} — commands</h3>
              <button onClick={() => setHistoryFor(null)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            {historyLoading ? <Loader2 className="w-5 h-5 animate-spin text-purple-400 mx-auto"/> : (
              history.length === 0 ? <p className="text-xs text-slate-500">No commands yet.</p> :
              history.map((c, i) => (
                <div key={i} className="p-2 rounded-lg bg-[#0f1117] border border-[#1e2130] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 font-medium">{c.action}</span>
                    <span className={`badge text-[10px] ${c.status === 'done' ? 'badge-green' : 'badge-default'}`}>{c.status}</span>
                  </div>
                  {c.result && <div className="text-slate-500 mt-1">{JSON.stringify(c.result).slice(0, 200)}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
