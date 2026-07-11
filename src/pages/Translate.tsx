import { useState, useEffect } from 'react'
import { translateAPI } from '@/lib/api'
import { ArrowRightLeft, Languages, Loader2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Lang { code: string; name: string }

/**
 * Live Translation — translate text between languages via the backend
 * LLM translator. Auto-detects the source language and lets the user
 * swap direction. Pairs with Maya's TTS (speak toggle) when available.
 */
export function Translate() {
  const [languages, setLanguages] = useState<Lang[]>([])
  const [source, setSource] = useState('auto')
  const [target, setTarget] = useState('en')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [detected, setDetected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    translateAPI.languages()
      .then((r: any) => setLanguages(r?.languages || []))
      .catch(() => setLanguages([
        { code: 'en', name: 'English' }, { code: 'bn', name: 'Bengali' },
      ]))
  }, [])

  const run = async () => {
    const text = input.trim()
    if (!text || loading) return
    setLoading(true)
    setOutput('')
    try {
      const res: any = await translateAPI.translate(
        text, target, source === 'auto' ? undefined : source)
      setOutput(res?.translation || '')
      setDetected(res?.source_name || null)
    } catch {
      toast.error('Translation failed — is the backend online?')
    } finally {
      setLoading(false)
    }
  }

  const swap = () => {
    // Swap only makes sense once we know the source language.
    const from = source === 'auto' ? detectedCode() : source
    if (!from) return
    setSource(target)
    setTarget(from)
    setInput(output)
    setOutput('')
  }

  const detectedCode = () => {
    if (!detected) return null
    return languages.find((l) => l.name === detected)?.code || null
  }

  const copy = () => {
    if (!output) return
    navigator.clipboard?.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-200">
        <Languages className="w-5 h-5 text-purple-400" /> Live Translation
      </div>

      <div className="flex items-center gap-2">
        <select value={source} onChange={(e) => setSource(e.target.value)}
          className="input flex-1">
          <option value="auto">Detect language</option>
          {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
        <button onClick={swap} className="btn-secondary px-3" title="Swap">
          <ArrowRightLeft className="w-4 h-4" />
        </button>
        <select value={target} onChange={(e) => setTarget(e.target.value)}
          className="input flex-1">
          {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      <textarea value={input} onChange={(e) => setInput(e.target.value)}
        placeholder="Type text to translate..." rows={4}
        className="input w-full resize-none" />

      <button onClick={run} disabled={!input.trim() || loading}
        className="btn-primary w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Translate'}
      </button>

      {output && (
        <div className="rounded-xl border border-[#252a3d] bg-[#1a1d2e] p-4 relative">
          {detected && source === 'auto' && (
            <div className="text-xs text-slate-500 mb-1">Detected: {detected}</div>
          )}
          <div className="text-slate-200 whitespace-pre-wrap pr-8">{output}</div>
          <button onClick={copy} className="absolute top-3 right-3 text-slate-400 hover:text-slate-200">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
