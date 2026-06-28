import { useState, useRef } from 'react'
import { useTaskStore, useAgentStore } from '@/store'
import { Send, Paperclip, Mic, Image, Plus, X } from 'lucide-react'

export function Dashboard() {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)
  const imageRef = useRef(null)
  const { tasks } = useTaskStore()
  const { status } = useAgentStore()

  const handleSubmit = async () => {
    if (!input.trim()) return
    setLoading(true)
    await new Promise(r=>setTimeout(r,1000))
    setLoading(false); setInput(''); setFiles([])
  }

  const suggestions = [
    'Search web for latest AI news',
    'Write a Python script',
    'Analyze my data and create report',
    'Help me with code review',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] items-center justify-center">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">M</div>
          <h1 className="text-2xl font-bold text-white">Maya 2.0 ULTRA</h1>
          <p className="text-sm text-slate-400 mt-1">Agent status: <span className="text-purple-400 font-mono">{status}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          {suggestions.map(s=>(
            <button key={s} onClick={()=>setInput(s)}
              className="text-left p-3 rounded-xl border border-[#1e2130] hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-xs text-slate-400">
              {s}
            </button>
          ))}
        </div>

        <div className="w-full bg-[#14161e] border border-[#1e2130] rounded-2xl p-3 focus-within:border-purple-500/40 transition-all">
          {files.length>0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((f,i)=>(
                <div key={i} className="flex items-center gap-1 bg-[#1a1d2e] rounded-lg px-2 py-1">
                  <span className="text-xs text-slate-400">{f.name}</span>
                  <button onClick={()=>setFiles(prev=>prev.filter((_,j)=>j!==i))}><X className="w-3 h-3 text-slate-500"/></button>
                </div>
              ))}
            </div>
          )}
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSubmit()}}}
            placeholder="Message Maya..."
            rows={3}
            className="w-full bg-transparent text-white text-sm placeholder:text-slate-500 outline-none resize-none"/>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" className="hidden" multiple onChange={e=>setFiles(prev=>[...prev,...Array.from(e.target.files||[])])}/>
              <input ref={imageRef} type="file" accept="image/*" className="hidden" multiple onChange={e=>setFiles(prev=>[...prev,...Array.from(e.target.files||[])])}/>
              <button onClick={()=>fileRef.current?.click()} className="p-2 hover:bg-[#1a1d2e] rounded-lg text-slate-400 hover:text-white transition-colors"><Paperclip className="w-4 h-4"/></button>
              <button onClick={()=>imageRef.current?.click()} className="p-2 hover:bg-[#1a1d2e] rounded-lg text-slate-400 hover:text-white transition-colors"><Image className="w-4 h-4"/></button>
              <button className="p-2 hover:bg-[#1a1d2e] rounded-lg text-slate-400 hover:text-white transition-colors"><Mic className="w-4 h-4"/></button>
            </div>
            <button onClick={handleSubmit} disabled={!input.trim()&&files.length===0}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white">
              <Send className="w-4 h-4"/>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span>{tasks.filter(t=>t.status==='done').length} tasks done</span>
          <span>•</span>
          <span>{tasks.filter(t=>t.status==='running').length} running</span>
        </div>
      </div>
    </div>
  )
}
