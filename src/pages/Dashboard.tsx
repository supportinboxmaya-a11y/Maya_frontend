import { useState, useRef } from 'react'
import { useAgentStore } from '@/store'
import { Mic, Plus, Activity } from 'lucide-react'

export function Dashboard() {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)
  const { status } = useAgentStore()

  const handleSubmit = async () => {
    if (!input.trim() && files.length===0) return
    const msg = {role:'user', content:input}
    setMessages(prev=>[...prev, msg])
    setInput(''); setFiles([])
    setLoading(true)
    await new Promise(r=>setTimeout(r,1500))
    setMessages(prev=>[...prev, {role:'assistant', content:'Task received! Working on it now...'}])
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length===0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl">M</div>
            <h1 className="text-2xl font-bold text-white">Maya 2.0 ULTRA</h1>
            <p className="text-sm text-slate-400">Agent: <span className="text-purple-400 font-mono">{status}</span></p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((m,i)=>(
              <div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}>
                {m.role==='assistant' && <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role==='user'?'bg-[#2a2d3e] text-white':'text-slate-200'}`}>
                  {m.content}
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
          </div>
        )}
      </div>

      <div className="px-3 pb-4">
        <div className="bg-[#1e2130] rounded-2xl px-4 py-3 mb-2">
          <input ref={fileRef} type="file" className="hidden" multiple onChange={e=>setFiles(prev=>[...prev,...Array.from(e.target.files||[])])}/>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();handleSubmit()}}}
            placeholder="Reply to Maya..."
            className="w-full bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"/>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>fileRef.current?.click()}
            className="w-9 h-9 rounded-full bg-[#1e2130] flex items-center justify-center text-slate-400 hover:text-white">
            <Plus className="w-5 h-5"/>
          </button>
          <button className="flex-1 h-9 rounded-full bg-[#1e2130] flex items-center justify-center gap-2 text-sm text-slate-300 font-medium">
            <Activity className="w-4 h-4 text-purple-400"/>
            Maya 2.0 ULTRA
          </button>
          <button className="w-9 h-9 rounded-full bg-[#1e2130] flex items-center justify-center text-slate-400 hover:text-white">
            <Mic className="w-4 h-4"/>
          </button>
          <button onClick={handleSubmit}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="black" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
