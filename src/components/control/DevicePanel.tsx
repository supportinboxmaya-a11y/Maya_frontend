import { useEffect, useState } from "react"
import { MonitorSmartphone, RefreshCw, Plus, Trash2, X, Send, Terminal } from "lucide-react"
import { Card, Skeleton } from "@/components/maya/ui"
import { deviceAPI } from "@/lib/api"
import toast from "react-hot-toast"

interface Device { id: string; name: string; paired_at: number; last_seen: number | null }

export function DevicePanel() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showPair, setShowPair] = useState(false)
  const [pairName, setPairName] = useState("")
  const [pairing, setPairing] = useState(false)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingComplete, setPairingComplete] = useState(false)
  const [revokePending, setRevokePending] = useState<Record<string, boolean>>({})
  const [cmdDeviceId, setCmdDeviceId] = useState("")
  const [cmdAction, setCmdAction] = useState("")
  const [cmdParams, setCmdParams] = useState("{}")
  const [cmdSending, setCmdSending] = useState(false)
  const [cmdResult, setCmdResult] = useState<string | null>(null)

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const res: any = await deviceAPI.list()
      setDevices(res?.devices || [])
    } catch {
      toast.error("Failed to load devices")
    }
    setLoading(false)
  }

  useEffect(() => { fetchDevices() }, [])

  const startPairing = async () => {
    setPairing(true)
    try {
      const res: any = await deviceAPI.pairStart(pairName.trim() || "My computer")
      setPairingCode(res.pairing_code)
      setPairingComplete(false)
    } catch {
      toast.error("Failed to generate pairing code")
    }
    setPairing(false)
  }

  const completePairing = async () => {
    if (!pairingCode) return
    setPairing(true)
    try {
      const res: any = await deviceAPI.pairComplete(pairingCode)
      if (res?.paired !== false) {
        toast.success("Device paired!")
        setPairingComplete(true)
        fetchDevices()
      }
    } catch {
      toast.error("Pairing failed — try again")
    }
    setPairing(false)
  }

  const revoke = async (id: string) => {
    if (!window.confirm("Revoke this device? It will immediately lose all access.")) return
    setRevokePending((p) => ({ ...p, [id]: true }))
    try {
      await deviceAPI.send({ device_id: id, action: "__revoke" })
      setDevices((prev) => prev.filter((d) => d.id !== id))
      toast.success("Revoked")
    } catch {
      toast.error("Failed to revoke")
    }
    setRevokePending((p) => ({ ...p, [id]: false }))
  }

  const sendCommand = async () => {
    if (!cmdDeviceId.trim() || !cmdAction.trim()) return
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(cmdParams) } catch { toast.error("Params must be valid JSON"); return }
    setCmdSending(true)
    setCmdResult(null)
    try {
      const res: any = await deviceAPI.command(cmdDeviceId.trim(), cmdAction.trim(), parsed)
      setCmdResult(typeof res === "string" ? res : JSON.stringify(res, null, 2))
      toast.success("Command sent")
    } catch (e: any) {
      toast.error(e?.detail || "Command failed")
    }
    setCmdSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold m-ink flex items-center gap-2">
          <MonitorSmartphone size={18} className="m-accent" /> Devices
        </h3>
        <button onClick={fetchDevices} className="m-press m-focus rounded-xl p-2 m-muted hover:bg-[var(--sunken)]"><RefreshCw size={16} /></button>
      </div>

      {/* Paired list */}
      {loading ? (
        <Card><div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={52} />)}</div></Card>
      ) : (
        <Card className="divide-y divide-[var(--border)] overflow-hidden">
          {devices.length === 0 ? (
            <div className="p-6 text-center text-sm m-muted">No devices paired.</div>
          ) : (
            devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium m-ink">{d.name}</div>
                  <div className="text-[11px] m-mono m-muted">{d.id}</div>
                  {d.last_seen && <div className="text-[11px] m-muted mt-0.5">Last seen {new Date(d.last_seen * 1000).toLocaleString()}</div>}
                </div>
                <button
                  onClick={() => revoke(d.id)}
                  disabled={revokePending[d.id]}
                  className="m-press m-focus p-1.5 rounded-lg"
                  style={{ color: "#EF4444" }}
                >
                  {revokePending[d.id] ? "…" : <Trash2 size={15} />}
                </button>
              </div>
            ))
          )}
          <button onClick={() => { setShowPair(true); setPairingCode(null); setPairName("") }}
            className="flex items-center justify-center gap-2 px-4 py-3 text-[13px] font-medium m-accent hover:bg-[var(--accent-soft)] transition-colors"
          >
            <Plus size={15} /> Pair a New Device
          </button>
        </Card>
      )}

      {/* Pair modal */}
      {showPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setShowPair(false)}>
          <div className="m-card p-4 w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold m-ink">Pair a Device</h3>
              <button onClick={() => setShowPair(false)} className="m-press m-focus p-1 rounded-lg"><X size={16} className="m-muted" /></button>
            </div>

            {!pairingCode ? (
              <>
                <input value={pairName} onChange={(e) => setPairName(e.target.value)} placeholder="Device name" className="w-full m-sunken m-bd rounded-xl px-3 py-2 text-[13px] m-ink outline-none" />
                <button onClick={startPairing} disabled={pairing} className="m-accent-bg rounded-xl px-4 py-2 text-[13px] font-semibold m-press m-focus w-full">
                  {pairing ? "…" : "Generate Pairing Code"}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-[10px] m-muted mb-1">Pairing code</div>
                  <div className="text-2xl font-mono font-bold m-accent tracking-widest">{pairingCode}</div>
                </div>
                <ol className="text-[12px] m-muted space-y-1 list-decimal list-inside">
                  <li>Run the bridge script on the target computer.</li>
                  <li>Enter the pairing code when prompted.</li>
                  <li>Return here and confirm pairing below.</li>
                </ol>
                <button onClick={completePairing} disabled={pairing || pairingComplete}
                  className="m-accent-bg rounded-xl px-4 py-2 text-[13px] font-semibold m-press m-focus w-full">
                  {pairingComplete ? "Paired ✓" : pairing ? "…" : "Complete Pairing"}
                </button>
                {pairingComplete && (
                  <button onClick={() => { setShowPair(false); fetchDevices() }} className="btn-secondary w-full text-[13px]">Done</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Command */}
      <div>
        <h3 className="text-[15px] font-semibold m-ink mb-3 flex items-center gap-2">
          <Terminal size={16} className="m-accent" /> Send Command
        </h3>
        <Card className="p-4 space-y-3">
          <select value={cmdDeviceId} onChange={(e) => setCmdDeviceId(e.target.value)}
            className="w-full m-sunken m-bd rounded-xl px-3 py-2 text-[13px] m-ink outline-none">
            <option value="">Select device…</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input value={cmdAction} onChange={(e) => setCmdAction(e.target.value)}
            placeholder="Action (e.g. click, type, screenshot)" className="w-full m-sunken m-bd rounded-xl px-3 py-2 text-[13px] m-ink outline-none" />
          <textarea value={cmdParams} onChange={(e) => setCmdParams(e.target.value)}
            rows={2} placeholder='{}' className="w-full m-sunken m-bd rounded-xl p-2 text-[12px] m-mono m-ink resize-none outline-none" />
          <div className="flex items-center gap-2">
            <button onClick={sendCommand} disabled={cmdSending || !cmdDeviceId || !cmdAction}
              className="m-accent-bg rounded-xl px-4 py-2 text-[13px] font-medium m-press m-focus flex items-center gap-1.5">
              <Send size={14} /> {cmdSending ? "…" : "Send"}
            </button>
            <span className="text-[11px] m-muted">Device must be online</span>
          </div>
          {cmdResult && (
            <pre className="text-[12px] m-muted m-sunken m-bd rounded-xl p-3 overflow-auto max-h-48">{cmdResult}</pre>
          )}
        </Card>
      </div>
    </div>
  )
}
