import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { Eye, Upload, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export function Vision() {
  const [image, setImage] = useState<string|null>(null)
  const [result, setResult] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('Describe this image in detail')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => setImage(e.target?.result as string)
    reader.readAsDataURL(file)
    setResult(null)
  }

  const analyze = async () => {
    if (!image) return
    setLoading(true)
    try {
      const res = await api.post('/vision/analyze', { image, prompt }) as any
      setResult(res?.result || res?.description || JSON.stringify(res))
    } catch { toast.error('Vision API unavailable — backend offline') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-bold text-white">Vision Studio</h1>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleFile(f) }}
        className="card p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-500/40 transition-all min-h-[180px]">
        {image ? (
          <div className="relative">
            <img src={image} alt="uploaded" className="max-h-48 rounded-lg object-contain"/>
            <button onClick={e => { e.stopPropagation(); setImage(null); setResult(null) }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
              <X className="w-3 h-3"/>
            </button>
          </div>
        ) : (
          <>
            <Eye className="w-10 h-10 text-slate-600"/>
            <div className="text-sm text-slate-500">Drop image or click to upload</div>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/>
      <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="What do you want to know about this image?" className="input w-full"/>
      <button onClick={analyze} disabled={!image || loading} className="btn-primary w-full justify-center">
        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Eye className="w-4 h-4"/>}
        Analyze Image
      </button>
      {result && (
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-2">Analysis Result</div>
          <div className="text-sm text-slate-200 whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  )
}
