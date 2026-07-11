import { useEffect, useState } from 'react'
import { toolAPI, workspaceFilesAPI } from '@/lib/api'
import { Loader2, RefreshCw, Play, X, Globe, MousePointerClick, Keyboard, Camera, Search, FileText } from 'lucide-react'
import type { Tool } from '@/types'
import toast from 'react-hot-toast'

export function Tools() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)

  // Generic "run any tool" modal
  const [runningTool, setRunningTool] = useState<Tool | null>(null)
  const [paramsJson, setParamsJson] = useState('{}')
  const [runOutput, setRunOutput] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  const fetchTools = async () => {
    setLoading(true)
    try {
      const data = await toolAPI.list()
      setTools((data as any) || [])
    } catch { setTools([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTools() }, [])

  const toggle = async (tool: Tool) => {
    try {
      await toolAPI.update(tool.name, !tool.enabled)
      setTools(prev => prev.map(t => t.name === tool.name ? {...t, enabled: !t.enabled} : t))
      toast.success(`${tool.name} ${!tool.enabled ? 'enabled' : 'disabled'}`)
    } catch { toast.error('Failed to update tool') }
  }

  const openRun = (tool: Tool) => {
    setRunningTool(tool); setParamsJson('{}'); setRunOutput(null)
  }

  const runTool = async () => {
    if (!runningTool) return
    let input: Record<string, unknown>
    try { input = JSON.parse(paramsJson) } catch { return toast.error('Params must be valid JSON') }
    setRunning(true); setRunOutput(null)
    try {
      const res: any = await toolAPI.run(runningTool.name, input)
      setRunOutput(typeof res?.result === 'string' ? res.result : JSON.stringify(res?.result, null, 2))
      fetchTools() // call_count/success_rate changed
    } catch (e: any) { toast.error(e?.detail || 'Tool run failed'); setRunOutput(null) }
    finally { setRunning(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Tool Manager</h1>
        <button onClick={fetchTools} className="btn-secondary"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>

      <BrowserControlPanel/>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : tools.length === 0 ? (
        <div className="text-center text-slate-500 py-20">⚠️ No tools found — backend offline</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map(tool => (
            <div key={tool.name} className="card p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{tool.name}</span>
                  <span className="badge badge-default text-[10px]">{tool.category}</span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{tool.description}</div>
                <div className="flex gap-3 text-[10px] text-slate-600">
                  <span>Calls: {tool.call_count}</span>
                  <span>Success: {tool.success_rate}%</span>
                  <span>Avg: {tool.avg_duration_ms}ms</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button onClick={() => toggle(tool)}
                  className={`w-10 h-5 rounded-full transition-colors ${tool.enabled ? 'bg-purple-500' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${tool.enabled ? 'translate-x-5' : 'translate-x-0'}`}/>
                </button>
                <button onClick={() => openRun(tool)} disabled={!tool.enabled} className="btn-secondary text-xs py-1 px-2">
                  <Play className="w-3 h-3"/>Run
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {runningTool && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setRunningTool(null)}>
          <div className="card p-4 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Run: {runningTool.name}</h3>
              <button onClick={() => setRunningTool(null)} aria-label="Close"><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <p className="text-xs text-slate-500">{runningTool.description}</p>
            <div>
              <label className="text-xs text-slate-400">Input (JSON)</label>
              <textarea value={paramsJson} onChange={e => setParamsJson(e.target.value)} rows={5}
                className="input w-full resize-none font-mono text-xs mt-1"/>
            </div>
            <button onClick={runTool} disabled={running} className="btn-primary">
              {running ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}Run
            </button>
            {runOutput !== null && (
              <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64">{runOutput}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Drives the already-registered browser_* tools (Playwright, headless
// Chromium) directly — this is how Maya autonomously browses/uses web
// apps as part of a goal; this panel exercises the same tools by hand.
function BrowserControlPanel() {
  const [url, setUrl] = useState('')
  const [selector, setSelector] = useState('')
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [output, setOutput] = useState<string | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const run = async (name: string, input: Record<string, unknown>, label: string) => {
    setBusy(label); setOutput(null)
    try {
      const res: any = await toolAPI.run(name, input)
      setOutput(typeof res?.result === 'string' ? res.result : JSON.stringify(res?.result))
    } catch (e: any) { toast.error(e?.detail || `${label} failed — is the browser tool installed on the backend?`) }
    finally { setBusy(null) }
  }

  const takeScreenshot = async () => {
    setBusy('screenshot'); setOutput(null); setScreenshotUrl(null)
    const filename = `shot-${Date.now()}.png`
    try {
      await toolAPI.run('browser_screenshot', { filename })
      const blob: any = await workspaceFilesAPI.fetchBlob(filename)
      setScreenshotUrl(URL.createObjectURL(blob))
      setOutput(`Saved as ${filename}`)
    } catch (e: any) { toast.error(e?.detail || 'Screenshot failed') }
    finally { setBusy(null) }
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-purple-400"/>Browser Control</h2>
      <p className="text-xs text-slate-500">Drives a real headless browser (Playwright) — the same tools Maya reaches for on its own when a goal needs a website. Try it here directly.</p>

      <div className="flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="input flex-1 text-sm"/>
        <button onClick={() => run('browser_open', { url }, 'open')} disabled={!url || busy !== null} className="btn-primary text-xs py-1.5 px-3">
          {busy === 'open' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Globe className="w-3.5 h-3.5"/>}Open
        </button>
      </div>

      <div className="flex gap-2">
        <input value={selector} onChange={e => setSelector(e.target.value)} placeholder="CSS selector" className="input flex-1 text-sm"/>
        <button onClick={() => run('browser_click', { selector }, 'click')} disabled={!selector || busy !== null} className="btn-secondary text-xs py-1.5 px-3">
          {busy === 'click' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <MousePointerClick className="w-3.5 h-3.5"/>}Click
        </button>
        <button onClick={() => run('browser_text', { selector }, 'text')} disabled={busy !== null} className="btn-secondary text-xs py-1.5 px-3">
          {busy === 'text' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <FileText className="w-3.5 h-3.5"/>}Read
        </button>
      </div>

      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Text to type" className="input flex-1 text-sm"/>
        <button onClick={() => run('browser_type', { selector, text }, 'type')} disabled={!selector || busy !== null} className="btn-secondary text-xs py-1.5 px-3">
          {busy === 'type' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Keyboard className="w-3.5 h-3.5"/>}Type
        </button>
      </div>

      <div className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Google for..." className="input flex-1 text-sm"/>
        <button onClick={() => run('browser_google', { query }, 'google')} disabled={!query || busy !== null} className="btn-secondary text-xs py-1.5 px-3">
          {busy === 'google' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Search className="w-3.5 h-3.5"/>}Search
        </button>
        <button onClick={takeScreenshot} disabled={busy !== null} className="btn-secondary text-xs py-1.5 px-3">
          {busy === 'screenshot' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Camera className="w-3.5 h-3.5"/>}Screenshot
        </button>
      </div>

      {output !== null && (
        <pre className="text-xs text-slate-300 bg-[#0f1117] border border-[#1e2130] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64">{output}</pre>
      )}
      {screenshotUrl && (
        <img src={screenshotUrl} alt="Browser screenshot" className="rounded-lg border border-[#1e2130] max-h-96 w-full object-contain bg-black"/>
      )}
    </div>
  )
}
