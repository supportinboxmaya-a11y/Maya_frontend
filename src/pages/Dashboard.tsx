
import toast from 'react-hot-toast'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Plus, Check, X, Wrench, Loader2, ShieldAlert, ArrowUp } from 'lucide-react'
import { agentAPI, createWebSocket } from '@/lib/api'
import { approvalsAPI } from '@/lib/agentLive'

type Step = { step?: number; title?: string; description?: string; tool?: string; result?: string; success?: boolean; error?: string }
type Task = { id: string; goal: string; status: string; steps: Step[]; current_phase?: string; provider_used?: string; cost_usd?: number; tokens_used?: number; result?: string; error?: string }
type Approval = { id: string; action?: string; reason?: string; risk_level?: string; task_id?: string; status?: string }
type Msg = { role: 'user' | 'assistant'; content: string; time: string }

const now = () => new Date().toLocaleTimeString()
const extractText = (v: any): string => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'object') {
    if (typeof v.output === 'string' && v.output.trim()) return v.output.trim()
    if (typeof v.result === 'string' && v.result.trim()) return v.result.trim()
    if (typeof v.reply === 'string' && v.reply.trim()) return v.reply.trim()
    if (typeof v.message === 'string' && v.message.trim()) return v.message.trim()
    if (typeof v.text === 'string' && v.text.trim()) return v.text.trim()
    if (typeof v.content === 'string' && v.content.trim()) return v.content.trim()
    if (typeof v.answer === 'string' && v.answer.trim()) return v.answer.trim()
    if (v.result && typeof v.result === 'object') { const inner = extractText(v.result); if (inner) return inner }
    if (typeof v.error === 'string' && v.error.trim()) return '⚠️ ' + v.error.trim()
    try { return JSON.stringify(v, null, 2) } catch { return String(v) }
  }
  return String(v)
}
const lastStepText = (t: any): string => {
  const steps = (t?.steps || []) as any[]
  for (let i = steps.length - 1; i >= 0; i--) {
    const txt = extractText(steps[i]?.result)
    if (txt && txt !== '{}') return txt
  }
  return ''
}
const stepState = (s: Step): 'done' | 'failed' | 'running' =>
  s.error || s.success === false ? 'failed' : (s.success === true || (s.result && s.result.length > 0)) ? 'done' : 'running'

function LiveWork({ task, approval, onApprove, onReject }: { task: Task; approval: Approval | null; onApprove: () => void; onReject: () => void }) {
  const steps = task.steps || []
  const finished = task.status === 'done' || task.status === 'failed'
  return (
    <div className="rounded-2xl border border-[#262b3f] bg-[#101219] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#262b3f]">
        {!finished
          ? <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          : task.status === 'failed'
            ? <X className="w-4 h-4 text-red-400" />
            : <Check className="w-4 h-4 text-emerald-400" />}
        <span className="text-[13px] text-slate-400 flex-1 truncate">
          {finished ? (task.status === 'failed' ? 'Stopped' : 'Completed') : (task.current_phase || 'Working...')}
        </span>
      </div>
      <div className="px-3 py-2 space-y-0.5">
        {steps.length === 0 && (
          <div className="flex items-center gap-3 px-1 py-2 text-sm text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> thinking...
          </div>
        )}
        {steps.map((s, i) => {
          const st = stepState(s)
          return (
            <div key={i} className="flex gap-3 px-1 py-2">
              <span className="mt-0.5 shrink-0">
                {st === 'done' ? <Check className="w-4 h-4 text-emerald-400" />
                  : st === 'failed' ? <X className="w-4 h-4 text-red-400" />
                    : <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-200">{s.title || s.description || ('Step ' + (s.step ?? i + 1))}</span>
                  {s.tool && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-purple-500/15 text-purple-300">
                      <Wrench className="w-3 h-3" />{s.tool}
                    </span>
                  )}
                </div>
                {s.description && s.title && <div className="text-[12px] text-slate-500 mt-0.5">{s.description}</div>}
                {s.error && <div className="text-[12px] text-red-400 mt-0.5">{s.error}</div>}
              </div>
            </div>
          )
        })}

        {approval && (
          <div className="mt-1 mb-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center gap-1.5 text-[13px] text-amber-200 font-medium mb-1">
              <ShieldAlert className="w-4 h-4" /> Maya needs your approval to continue
            </div>
            {(approval.action || approval.reason) && (
              <div className="text-[12px] text-slate-400 mb-2.5">
                {approval.action}{approval.action && approval.reason ? ' - ' : ''}{approval.reason}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={onApprove} className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors">Approve</button>
              <button onClick={onReject} className="rounded-lg bg-[#1e2130] hover:bg-[#262b3f] px-4 py-2 text-[13px] font-medium text-slate-200 transition-colors">Deny</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Dashboard() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { return JSON.parse(localStorage.getItem('maya_chat') || '[]') } catch { return [] }
  })
  const [busy, setBusy] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [approval, setApproval] = useState<Approval | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const targetId = useRef<string | null>(null)
  const goalRef = useRef('')
  const finalized = useRef(false)

  useEffect(() => {
    const h = () => { try { setMessages(JSON.parse(localStorage.getItem('maya_chat') || '[]')) } catch {} }
    window.addEventListener('maya_chat_changed', h)
    return () => window.removeEventListener('maya_chat_changed', h)
  }, [])
  useEffect(() => {
    localStorage.setItem('maya_chat', JSON.stringify(messages))
    const chatId = localStorage.getItem('maya_active_chat')
    if (chatId && messages.length > 0) {
      const chats = JSON.parse(localStorage.getItem('maya_chats') || '[]')
      localStorage.setItem('maya_chats', JSON.stringify(chats.map((c: any) => c.id === chatId ? { ...c, messages, title: messages[0]?.content?.slice(0, 30) || 'New Chat' } : c)))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [task, approval])
  useEffect(() => () => { try { wsRef.current?.close() } catch {} }, [])

  const addMsg = (m: Msg) => setMessages(prev => [...prev, m])

  const finish = useCallback((t: Task | null, errText?: string) => {
    if (finalized.current) return
    finalized.current = true
    let text: string
    if (errText) {
      text = errText
    } else {
      let out = extractText((t as any)?.result)
      if (!out || out === '{}') out = lastStepText(t)
      if (!out && t?.error) out = '⚠️ ' + t.error
      if (!out && t?.status === 'failed') out = '⚠️ The task stopped early. Try rephrasing, or ask me to continue.'
      text = out || 'Done.'
    }
    setMessages(prev => [...prev, { role: 'assistant', content: text, time: now() }])
    setBusy(false)
    setTask(null)
    setApproval(null)
  }, [])

  const ensureWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return
    try {
      wsRef.current = createWebSocket((data: any) => {
        const m = data
        if (!m || !m.type) return
        const id = m.task?.id || m.task_id
        if (!targetId.current && m.task && (!goalRef.current || m.task.goal === goalRef.current)) targetId.current = m.task.id
        const mine = id && targetId.current && id === targetId.current
        if ((m.type === 'task_started' || m.type === 'task_progress') && m.task && (mine || !targetId.current)) {
          if (!targetId.current) targetId.current = m.task.id
          setTask(m.task)
        } else if (m.type === 'approval_requested' && m.approval) {
          if (!m.approval.task_id || !targetId.current || m.approval.task_id === targetId.current) setApproval(m.approval)
        } else if (m.type === 'task_done' && m.task && mine) {
          setTask(m.task); finish(m.task)
        }
      })
    } catch { /* WS optional */ }
  }, [finish])

  const run = async (goal: string) => {
    finalized.current = false
    targetId.current = null
    goalRef.current = goal
    setTask({ id: 'pending', goal, status: 'running', steps: [] })
    setApproval(null)
    setBusy(true)
    ensureWS()
    try {
      const res: any = await agentAPI.run(goal)
      const t: Task | undefined = res?.steps ? res : res?.task
      const id = t?.id || res?.task_id || res?.id
      if (id) targetId.current = id
      if (t?.steps) {
        setTask(t)
        if (t.status === 'done' || t.status === 'failed') finish(t)
      } else if (res && (res.result || res.reply || res.message || res.output || res.success !== undefined)) {
        finish(null, extractText(res))
      }
    } catch (e: any) {
      const st = e?.status || e?.response?.status
      if (st === 401) {
        finish(null, '🔒 Session expired. Please log in again.')
        localStorage.removeItem('maya_token')
        setTimeout(() => { window.location.href = '/auth' }, 1500)
      } else {
        finish(null, '⚠️ ' + (e?.error || e?.response?.data?.error || e?.message || 'Request failed.'))
      }
    }
  }

  const decide = async (d: 'approve' | 'reject') => {
    const a = approval; if (!a?.id) return
    setApproval(null)
    try { await approvalsAPI.decide(a.id, d) }
    catch (e: any) { setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + (e?.message || 'Approval failed'), time: now() }]) }
    if (d === 'reject') finish(task, 'Stopped - I did not run that step.')
  }

  const handleSubmit = () => {
    const q = input.trim()
    if (!q || busy) return
    if (!localStorage.getItem('maya_active_chat')) {
      const id = Date.now().toString()
      const chats = JSON.parse(localStorage.getItem('maya_chats') || '[]')
      localStorage.setItem('maya_chats', JSON.stringify([{ id, title: q.slice(0, 30), time: now(), messages: [] }, ...chats]))
      localStorage.setItem('maya_active_chat', id)
    }
    addMsg({ role: 'user', content: q, time: now() })
    setInput('')
    run(q)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 3.5rem)' }}>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="px-4 py-6">
        {messages.length === 0 && !task ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">M</div>
            <h1 className="text-xl font-semibold text-slate-100">How can I help?</h1>
            <p className="text-sm text-slate-500">Give Maya a task - you will see the work as it happens.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[#22252f] px-4 py-2.5 text-[15px] text-slate-100 whitespace-pre-wrap">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5">M</div>
                  <div className="text-[15px] leading-relaxed text-slate-200 whitespace-pre-wrap flex-1 min-w-0 pt-0.5">{m.content}</div>
                </div>
              )
            ))}

            {task && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5">M</div>
                <div className="flex-1 min-w-0">
                  <LiveWork task={task} approval={approval} onApprove={() => decide('approve')} onReject={() => decide('reject')} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0 }} className="px-3 pb-4 pt-1 bg-[#0a0b0f]">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-[#262b3f] bg-[#14161e] px-4 py-3">
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.txt,.md,.csv,.json,.log"
              onChange={async (e) => {
                const file = e.target.files?.[0]; e.target.value = ''
                if (!file) return
                const { api } = await import('@/lib/api')
                if (file.type.startsWith('image/')) {
                  addMsg({ role: 'user', content: '🖼️ ' + file.name, time: now() }); setBusy(true)
                  const reader = new FileReader()
                  reader.onload = async ev => {
                    try { const res: any = await api.post('/vision/analyze', { image: ev.target?.result, prompt: 'Describe this image' }); addMsg({ role: 'assistant', content: res?.result || 'No analysis returned.', time: now() }) }
                    catch (err: any) { addMsg({ role: 'assistant', content: '⚠️ ' + (err?.detail || err?.error || 'Vision analysis failed'), time: now() }) }
                    finally { setBusy(false) }
                  }
                  reader.readAsDataURL(file)
                } else {
                  if (file.size > 100 * 1024) return toast.error('Text files up to 100KB are supported')
                  const text = await file.text()
                  addMsg({ role: 'user', content: '📎 ' + file.name, time: now() }); setBusy(true)
                  try { const res: any = await api.post('/agent/chat', { message: 'The user attached a file named "' + file.name + '". Its content:\n\n' + text + '\n\nSummarize or respond to it.' }); addMsg({ role: 'assistant', content: res?.reply || 'No response.', time: now() }) }
                  catch (err: any) { addMsg({ role: 'assistant', content: '⚠️ ' + (err?.detail || err?.error || 'Failed to send file'), time: now() }) }
                  finally { setBusy(false) }
                }
              }} />
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={1}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              placeholder="Message Maya..."
              className="w-full bg-transparent text-white text-[15px] placeholder:text-slate-500 outline-none resize-none max-h-40" />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => fileRef.current?.click()} className="w-8 h-8 rounded-full hover:bg-[#22252f] flex items-center justify-center text-slate-400 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
              <div className="flex-1" />
              <button
                onClick={() => {
                  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return toast.error('Voice not supported in this browser')
                  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
                  const rec = new SR(); rec.lang = 'en-US'
                  rec.onresult = (e: any) => setInput(e.results[0][0].transcript)
                  rec.onerror = () => toast.error('Microphone error')
                  rec.start()
                }}
                className="w-8 h-8 rounded-full hover:bg-[#22252f] flex items-center justify-center text-slate-400 hover:text-purple-400 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
              <button onClick={handleSubmit} disabled={!input.trim() || busy}
                className="w-8 h-8 rounded-full bg-white disabled:opacity-30 flex items-center justify-center transition-opacity">
                <ArrowUp className="w-4 h-4 text-black" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 text-center mt-2">Maya can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  )
}
