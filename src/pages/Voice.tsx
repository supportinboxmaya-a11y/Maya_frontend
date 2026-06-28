import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Waves, Play, Square, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/utils'

type VoiceState = "idle"|"listening"|"processing"|"speaking"

const voiceHistory = [
  {id:1,text:"Search web for latest AI news",mode:"run",timestamp:"2025-01-15T12:00:00Z"},
  {id:2,text:"What is the capital of France?",mode:"chat",timestamp:"2025-01-15T11:30:00Z"},
  {id:3,text:"Write a Python script to sort numbers",mode:"run",timestamp:"2025-01-15T10:00:00Z"},
]

export function Voice() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const [transcript, setTranscript] = useState("")
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [wakeWord, setWakeWord] = useState(false)
  const [volume, setVolume] = useState(80)
  const [bars, setBars] = useState<number[]>(Array(20).fill(4))
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(()=>{
    if(voiceState==="listening"){
      intervalRef.current = setInterval(()=>setBars(Array(20).fill(0).map(()=>Math.random()*40+4)),100)
    } else {
      clearInterval(intervalRef.current)
      setBars(Array(20).fill(4))
    }
    return ()=>clearInterval(intervalRef.current)
  },[voiceState])

  const toggle = () => {
    if(voiceState==="idle"){
      setVoiceState("listening")
      setTranscript("")
      setTimeout(()=>{
        setTranscript("Search the web for latest AI news...")
        setVoiceState("processing")
        setTimeout(()=>setVoiceState("idle"),2000)
      },3000)
    } else {
      setVoiceState("idle")
      setTranscript("")
    }
  }

  const stateConfig = {
    idle:{label:"Click to speak",color:"text-slate-400",ring:"ring-[#1e2130]"},
    listening:{label:"Listening...",color:"text-red-400",ring:"ring-red-500"},
    processing:{label:"Processing...",color:"text-yellow-400",ring:"ring-yellow-500"},
    speaking:{label:"Maya speaking...",color:"text-emerald-400",ring:"ring-emerald-500"},
  }
  const cfg = stateConfig[voiceState]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Voice Studio</h1>
        <p className="text-sm text-slate-400 mt-0.5">Talk to Maya with your voice</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-8 flex flex-col items-center gap-6">
            <button onClick={toggle}
              className={cn("w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ring-4",
                cfg.ring, voiceState==="idle"?"bg-[#1a1d2e] hover:bg-[#14161e]":"bg-red-500/20",
                voiceState==="listening"&&"scale-110")}>
              {voiceState==="idle" ? <Mic className="w-10 h-10 text-white"/> : <MicOff className="w-10 h-10 text-red-400"/>}
            </button>
            <div className="text-center">
              <p className={cn("text-sm font-medium",cfg.color)}>{cfg.label}</p>
              {transcript && <p className="text-sm text-white mt-2 max-w-md text-center">{transcript}</p>}
            </div>
            <div className="flex items-center gap-1 h-12">
              {bars.map((h,i)=>(
                <div key={i} className={cn("w-1.5 rounded-full transition-all duration-100",voiceState==="listening"?"bg-red-400":"bg-[#1e2130]")}
                  style={{height:`${h}px`}}/>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="badge-purple">run — autonomous</span>
              <span className="badge-blue">chat — conversation</span>
              <span className="badge-yellow">think — reasoning</span>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Text-to-Speech</h3>
              <button onClick={()=>setTtsEnabled(!ttsEnabled)} className="flex items-center gap-2 text-sm text-slate-400">
                {ttsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400"/> : <VolumeX className="w-4 h-4"/>}
                {ttsEnabled?"Enabled":"Disabled"}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-xs text-slate-400"><span>Volume</span><span>{volume}%</span></div>
                <input type="range" min={0} max={100} value={volume} onChange={e=>setVolume(Number(e.target.value))} className="w-full accent-purple-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Voice</label>
                <select className="input text-xs">
                  <option>Maya (Default)</option>
                  <option>Natural Female</option>
                  <option>Natural Male</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary text-xs py-1.5 px-3"><Play className="w-3 h-3"/>Test</button>
                <button className="btn-secondary text-xs py-1.5 px-3"><Square className="w-3 h-3"/>Stop</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Wake Word</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wakeWord} onChange={e=>setWakeWord(e.target.checked)} className="accent-purple-500 w-4 h-4"/>
                <span className="text-xs text-slate-400">Enable</span>
              </label>
            </div>
            <div className={cn("p-3 rounded-lg border text-center",wakeWord?"bg-purple-500/10 border-purple-500/30":"bg-[#1a1d2e] border-[#1e2130]")}>
              <Waves className={cn("w-6 h-6 mx-auto mb-1",wakeWord?"text-purple-400 animate-pulse":"text-slate-500")}/>
              <p className="text-xs text-slate-400">Say <strong className="text-white">Hey Maya</strong></p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Language</h3>
            <select className="input text-sm">
              <option value="en-US">English (US)</option>
              <option value="bn-BD">বাংলা</option>
              <option value="hi-IN">हिन्दी</option>
              <option value="ar-SA">العربية</option>
            </select>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Voice History</h3>
              <History className="w-4 h-4 text-slate-500"/>
            </div>
            <div className="space-y-2">
              {voiceHistory.map(h=>(
                <div key={h.id} className="p-2.5 bg-[#1a1d2e] rounded-lg">
                  <p className="text-xs text-white mb-1">{h.text}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("badge",h.mode==="run"?"badge-purple":"badge-blue")}>{h.mode}</span>
                    <span className="text-xs text-slate-500">{timeAgo(h.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}