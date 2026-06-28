import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { Mic, Square, Loader2, Volume2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function Voice() {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = async e => {
          setProcessing(true)
          try {
            const res = await api.post('/voice/transcribe', { audio: e.target?.result }) as any
            const text = res?.transcript || ''
            setTranscript(text)
            if (text) {
              const chat = await api.post('/agent/chat', { message: text }) as any
              setResponse(chat?.reply || chat?.message || '')
            }
          } catch { toast.error('Voice API unavailable — backend offline') }
          finally { setProcessing(false) }
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch { toast.error('Microphone access denied') }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-bold text-white">Voice Studio</h1>
      <div className="flex flex-col items-center gap-6 py-8">
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            recording ? 'bg-red-500 hover:bg-red-400 animate-pulse' : 'bg-purple-600 hover:bg-purple-500'
          } disabled:opacity-50`}>
          {processing ? <Loader2 className="w-10 h-10 text-white animate-spin"/> :
           recording ? <Square className="w-10 h-10 text-white"/> :
           <Mic className="w-10 h-10 text-white"/>}
        </button>
        <div className="text-sm text-slate-400">
          {processing ? 'Processing...' : recording ? 'Recording — tap to stop' : 'Tap to start recording'}
        </div>
      </div>
      {transcript && (
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-2">Transcript</div>
          <div className="text-sm text-white">{transcript}</div>
        </div>
      )}
      {response && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-4 h-4 text-purple-400"/>
            <div className="text-xs text-slate-500">Maya Response</div>
          </div>
          <div className="text-sm text-slate-200">{response}</div>
        </div>
      )}
    </div>
  )
}
