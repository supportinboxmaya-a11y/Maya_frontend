import { useState, useRef, useEffect } from 'react'
import { agentAPI } from '@/lib/api'
import { Send, Loader2, Square } from 'lucide-react'
import toast from 'react-hot-toast'

interface Msg { role: 'user' | 'assistant'; content: string }

/**
 * Live chat with token-by-token streaming (SSE via agentAPI.streamChat).
 * The assistant message fills in as chunks arrive, so replies feel instant.
 * Falls back to a non-streaming request if the stream endpoint is
 * unavailable, so it works against older backends too.
 */
export function LiveChat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const stop = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text },
                                   { role: 'assistant', content: '' }])
    setStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller

    const appendToLast = (delta: string) =>
      setMessages(prev => {
        const copy = prev.slice()
        copy[copy.length - 1] = {
          role: 'assistant',
          content: copy[copy.length - 1].content + delta,
        }
        return copy
      })

    try {
      await agentAPI.streamChat(text, appendToLast, { signal: controller.signal })
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        appendToLast('\n\n[stopped]')
      } else {
        // Fallback: try the non-streaming endpoint once.
        try {
          const res: any = await agentAPI.chat(text)
          appendToLast(res?.reply || '[no response]')
        } catch {
          toast.error('Chat unavailable — backend offline')
          appendToLast('[error: could not reach Maya]')
        }
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-500 pt-10">
            Ask Maya anything — replies stream in live.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-purple-600/90 text-white'
                : 'bg-[#1a1d2e] text-slate-200 border border-[#252a3d]'}`}>
              {m.content || (streaming && i === messages.length - 1
                ? <span className="inline-flex items-center gap-1 text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin"/> thinking…
                  </span>
                : '')}
              {m.role === 'assistant' && streaming && i === messages.length - 1 && m.content && (
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-purple-400 animate-pulse"/>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Message Maya..." className="input flex-1"/>
        {streaming ? (
          <button onClick={stop} className="btn-secondary px-4" title="Stop">
            <Square className="w-4 h-4"/>
          </button>
        ) : (
          <button onClick={send} disabled={!input.trim()} className="btn-primary px-4">
            <Send className="w-4 h-4"/>
          </button>
        )}
      </div>
    </div>
  )
}
