import toast from 'react-hot-toast'
import { useState, useRef, useEffect } from 'react'
import { useAgentStore } from '@/store'
import { Mic, Plus, Activity } from 'lucide-react'

export function Dashboard() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<any[]>(()=>{
    try { return JSON.parse(localStorage.getItem('maya_chat')||'[]') } catch { return [] }
  })
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { status } = useAgentStore()

  useEffect(()=>{
    const handler = () => {
      try { setMessages(JSON.parse(localStorage.getItem('maya_chat')||'[]')) } catch {}
    }
    window.addEventListener('maya_chat_changed', handler)
    return () => window.removeEventListener('maya_chat_changed', handler)
  }, [])

  useEffect(()=>{
    localStorage.setItem('maya_chat', JSON.stringify(messages))
    const chatId = localStorage.getItem('maya_active_chat')
    if (chatId && messages.length>0) {
      const chats = JSON.parse(localStorage.getItem('maya_chats')||'[]')
      const updated = chats.map((c: any)=>c.id===chatId?{...c, messages, title:messages[0]?.content?.slice(0,30)||'New Chat'}:c)
      localStorage.setItem('maya_chats', JSON.stringify(updated))
    }
    bottomRef.current?.scrollIntoView({behavior:'smooth'})
  }, [messages])

  const handleSubmit = async () => {
    if (!input.trim()) return
    if (!localStorage.getItem('maya_active_chat')) {
      const id = Date.now().toString()
      const chat = {id, title:input.slice(0,30), time:new Date().toLocaleTimeString(), messages:[]}
      const chats = JSON.parse(localStorage.getItem('maya_chats')||'[]')
      localStorage.setItem('maya_chats', JSON.stringify([chat,...chats]))
      localStorage.setItem('maya_active_chat', id)
    }
    const msg = {role:'user', content:input, time:new Date().toLocaleTimeString()}
    setMessages(prev=>[...prev, msg])
    const currentInput = input
    setInput('')
    setLoading(true)
    try {
      const { agentAPI } = await import('@/lib/api')
      const res: any = await agentAPI.chat(currentInput)
      const reply = res?.reply || res?.message || res?.result || 'No response received.'
      setMessages(prev=>[...prev, {role:'assistant', content: reply, time:new Date().toLocaleTimeString()}])
    } catch (e: any) {
      // Show the REAL error so problems are visible, not hidden
      const status = e?.status || e?.response?.status
      let errMsg = ''
      if (status === 401) {
        errMsg = '🔒 Session expired. Please log in again.'
        localStorage.removeItem('maya_token')
        setTimeout(()=>{ window.location.href = '/auth' }, 1500)
      } else {
        errMsg = '⚠️ ' + (e?.error || e?.response?.data?.error || e?.message || 'Request failed. Please try again.')
      }
      setMessages(prev=>[...prev, {role:'assistant', content: errMsg, time:new Date().toLocaleTimeString()}])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'calc(100dvh - 3.5rem)'}}>
      <div style={{flex:1, overflowY:'auto', padding:'1.5rem 1rem', minHeight:0}}>
        {messages.length===0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl">M</div>
            <h1 className="text-2xl font-bold text-white">Maya 2.0 ULTRA</h1>
            <p className="text-sm text-slate-400">Agent: <span className="text-purple-400 font-mono">{status}</span></p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((m,i)=>(
              <div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}>
                {m.role==='assistant' && <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>}
                <div>
                  <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm ${m.role==='user'?'bg-[#2a2d3e] text-white':'text-slate-200'}`}>{m.content}</div>
                  <span className="text-[10px] text-slate-600 mt-1 px-1 block">{m.time}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">M</div>
                <div className="flex gap-1 items-center px-2 py-3">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      <div style={{flexShrink:0, padding:'0 0.75rem 1rem', background:'#0a0b0f'}}>
        <div className="bg-[#1e2130] rounded-2xl px-4 py-3 mb-2">
          <input ref={fileRef} type="file" className="hidden" multiple
          onChange={(e) => {
            const files = e.target.files
            if (!files || files.length === 0) return
            const names = Array.from(files).map(f => f.name).join(', ')
            setMessages(prev=>[...prev, {role:'user', content:`📎 Attached: ${names}`, time:new Date().toLocaleTimeString()}])
            e.target.value = ''
          }}/>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();handleSubmit()}}}
            placeholder="Reply to Maya..."
            className="w-full bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"/>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>fileRef.current?.click()} className="w-9 h-9 rounded-full bg-[#1e2130] flex items-center justify-center text-slate-400">
            <Plus className="w-5 h-5"/>
          </button>
          <button className="flex-1 h-9 rounded-full bg-[#1e2130] flex items-center justify-center gap-2 text-sm text-slate-300 font-medium">
            <Activity className="w-4 h-4 text-purple-400"/>Maya 2.0 ULTRA
          </button>
          <button
            onClick={() => {
              if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                toast.error('Voice not supported in this browser')
                return
              }
              const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
              const rec = new SR()
              rec.lang = 'en-US'
              rec.onresult = (e: any) => setInput(e.results[0][0].transcript)
              rec.onerror = () => toast.error('Microphone error')
              rec.start()
            }}
            className="w-9 h-9 rounded-full bg-[#1e2130] flex items-center justify-center text-slate-400 hover:text-purple-400 transition-colors">
            <Mic className="w-4 h-4"/>
          </button>
          <button onClick={handleSubmit} className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="black" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
