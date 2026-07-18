import { useEffect, useRef, useState, useCallback } from "react"
import { Plus, Mic, Send, Globe, Code2, Languages, Eye, Volume2, Paperclip, Square, Image as ImageIcon, StopCircle } from "lucide-react"
import { Orb } from "@/components/maya/Orb"
import { ExecCard } from "@/components/maya/ExecCard"
import { useAgentRun } from "@/hooks/useAgentRun"
import { agentAPI, voiceAPI, visionAPI } from "@/lib/api"
import toast from "react-hot-toast"

type Msg = { role: "user" | "maya"; text: string; image?: string }

const TOOLS = [
  { icon: Globe, label: "Web search", action: "Search the web for" },
  { icon: Code2, label: "Run code", action: "Run this code:" },
  { icon: Languages, label: "Translate", action: "Translate this:" },
  { icon: Eye, label: "Analyze image", action: null }, // handled by image upload
  { icon: Volume2, label: "Speak", action: "Say this aloud:" },
  { icon: Paperclip, label: "Attach file", action: "Read this file:" },
]

export function Chat({ admin }: { admin: boolean }) {
  const [mode, setMode] = useState<"Agent" | "Chat" | "Think">("Agent")
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "maya", text: "Hi, I'm Maya. Give me a goal — you'll see me work through it live." },
  ])
  const [input, setInput] = useState("")
  const [toolsOpen, setToolsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const run = useAgentRun()
  const endRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs, run.task, run.approval])

  useEffect(() => {
    if ((run.status === "done" || run.status === "failed") && run.task && !doneRef.current) {
      doneRef.current = true
      setMsgs((m) => [
        ...m,
        { role: "maya", text: run.status === "failed" ? (run.task!.error || "Stopped.") : (run.task!.result || "Done.") },
      ])
      setBusy(false)
    }
  }, [run.status, run.task])

  const appendUserMsg = useCallback((text: string) => {
    setMsgs((m) => [...m, { role: "user", text }])
  }, [])

  const appendMayaMsg = useCallback((text: string) => {
    setMsgs((m) => [...m, { role: "maya", text }])
  }, [])

  const send = async () => {
    const q = input.trim()
    if (!q || busy) return
    setInput("")
    setToolsOpen(false)
    appendUserMsg(q)
    setBusy(true)
    doneRef.current = false

    if (mode === "Agent") {
      run.reset()
      run.start(q)
    } else if (mode === "Think") {
      try {
        const r = (await agentAPI.think(q)) as any
        appendMayaMsg(r?.result || r?.answer || JSON.stringify(r, null, 2))
      } catch (e: any) {
        appendMayaMsg(`Error: ${e?.message || e}`)
      } finally {
        setBusy(false)
      }
    } else {
      // Chat mode — stream
      let acc = ""
      setMsgs((m) => [...m, { role: "maya", text: "" }])
      try {
        await agentAPI.streamChat(q, (d) => {
          acc += d
          setMsgs((m) => {
            const c = [...m]
            c[c.length - 1] = { role: "maya", text: acc }
            return c
          })
        })
      } catch {
        // Fallback to non-streaming
        try {
          const r = (await agentAPI.chat(q)) as any
          setMsgs((m) => {
            const c = [...m]
            c[c.length - 1] = { role: "maya", text: r?.response || r?.reply || "…" }
            return c
          })
        } catch (e: any) {
          setMsgs((m) => {
            const c = [...m]
            c[c.length - 1] = { role: "maya", text: `Error: ${e?.message || e}` }
            return c
          })
        }
      } finally {
        setBusy(false)
      }
    }
  }

  // ── Voice recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setBusy(true)
        try {
          const result = await voiceAPI.transcribe(blob)
          if (result?.text) {
            setInput((v) => v + (v ? " " : "") + result.text)
            toast.success("Transcribed")
          }
        } catch {
          toast.error("Voice transcription failed")
        } finally {
          setBusy(false)
          setRecording(false)
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      toast.error("Microphone access denied")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  // ── Image analysis ──
  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setToolsOpen(false)
    setBusy(true)

    try {
      const b64 = await fileToBase64(file)
      appendUserMsg(`[Analyzing image: ${file.name}]`)
      const result = await visionAPI.analyze(b64, input.trim() || undefined)
      appendMayaMsg(result?.analysis || result?.description || "No analysis returned.")
    } catch (err: any) {
      appendMayaMsg(`Image analysis failed: ${err?.message || "Unknown error"}`)
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const showCard = mode === "Agent" && run.task

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* Hidden file input for images */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

      {/* Mode selector */}
      <div className="px-4 md:px-6 pt-4 pb-2 flex items-center gap-3">
        <div className="m-seg" role="tablist">
          {(["Chat", "Agent", "Think"] as const).map((m) => (
            <button key={m} data-on={mode === m} onClick={() => setMode(m)} className="m-focus">{m}</button>
          ))}
        </div>
        <span className="text-xs m-muted hidden sm:block">
          {mode === "Agent" ? "Runs a task live" : mode === "Think" ? "Deep reasoning" : "Quick chat"}
        </span>
        {recording && (
          <button onClick={stopRecording} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold m-press m-focus" style={{ color: "#EF4444", background: "rgba(239,68,68,.1)" }}>
            <StopCircle size={14} /> Recording…
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto m-hide-sb px-4 md:px-6 py-4 space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 m-rise ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "maya" ? (
              <Orb size={30} />
            ) : (
              <div className="rounded-full m-sunken m-bd flex items-center justify-center text-xs font-semibold m-muted" style={{ width: 30, height: 30 }}>You</div>
            )}
            <div>
              {m.image && (
                <img src={m.image} alt="Uploaded" className="rounded-xl mb-1" style={{ maxWidth: 200, maxHeight: 200 }} />
              )}
              {m.text && (
                <div
                  className={`px-4 py-2.5 text-[15px] whitespace-pre-wrap ${
                    m.role === "user" ? "m-accent-bg" : "m-surface m-bd"
                  }`}
                  style={{
                    maxWidth: "80vw",
                    borderRadius: 18,
                    borderTopLeftRadius: m.role === "maya" ? 6 : 18,
                    borderTopRightRadius: m.role === "user" ? 6 : 18,
                  }}
                >
                  {m.text}
                </div>
              )}
            </div>
          </div>
        ))}

        {showCard && run.task && (
          <ExecCard task={run.task} approval={run.approval} admin={admin} onApprove={run.approve} onReject={run.reject} />
        )}
        {run.error && (
          <div className="text-[13px]" style={{ color: "#EF4444", marginLeft: 42 }}>{run.error}</div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 md:px-6 pb-5 pt-2">
        {/* Tools popup */}
        {toolsOpen && (
          <div className="m-card m-shadow p-2 mb-2 grid grid-cols-3 gap-1 m-rise">
            {TOOLS.map((t) => (
              <button
                key={t.label}
                onClick={() => {
                  if (t.action === null) {
                    // "Analyze image" opens file picker
                    fileInputRef.current?.click()
                  } else {
                    setInput((v) => v + (v ? " " : "") + t.action + " ")
                  }
                  setToolsOpen(false)
                }}
                className="m-nav m-focus m-press"
              >
                <t.icon size={16} className="m-accent" />
                <span className="text-[13px]">{t.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="m-card m-shadow-sm p-2 flex items-end gap-2">
          <button
            aria-label="tools"
            onClick={() => setToolsOpen((v) => !v)}
            className="m-accent-soft rounded-xl p-2.5 m-press m-focus"
            style={{ transform: toolsOpen ? "rotate(45deg)" : "none", transition: "transform .18s" }}
          >
            <Plus size={18} className="m-accent" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder={
              recording ? "Recording…" :
              mode === "Agent" ? "Give Maya a goal to run…" :
              mode === "Think" ? "What should Maya think about?" :
              "Message Maya…"
            }
            className="flex-1 bg-transparent resize-none outline-none text-[15px] m-ink py-2"
            style={{ minHeight: 24, maxHeight: 128 }}
          />

          <button
            aria-label="image"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-2.5 m-press m-focus m-muted"
          >
            <ImageIcon size={18} />
          </button>

          <button
            aria-label="voice"
            onClick={recording ? stopRecording : startRecording}
            className="rounded-xl p-2.5 m-press m-focus"
            style={{ color: recording ? "#EF4444" : "var(--muted)" }}
          >
            {recording ? <StopCircle size={18} /> : <Mic size={18} />}
          </button>

          <button
            aria-label="send"
            onClick={send}
            disabled={!input.trim() || busy}
            className="m-accent-bg rounded-xl p-2.5 m-press m-focus"
            style={{ opacity: (!input.trim() || busy) ? 0.4 : 1 }}
          >
            {busy ? <Square size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data:image/...;base64, prefix — just the base64 payload
      const comma = result.indexOf(",")
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
