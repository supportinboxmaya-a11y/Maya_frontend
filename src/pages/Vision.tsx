import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image, Eye, Scan, Trash2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const sampleResults = [
  {label:"Screenshot Analysis",confidence:98,description:"Dashboard UI with dark theme, multiple charts and sidebar navigation"},
  {label:"Text Detected",confidence:95,description:"Found 247 text elements including headings, labels, and code snippets"},
  {label:"UI Components",confidence:92,description:"Detected: 3 charts, 8 cards, 1 sidebar, 4 buttons, 12 badges"},
]

const imageHistory = [
  {id:1,name:"screenshot_001.png",size:"245 KB",analyzed:true,timestamp:"2 mins ago"},
  {id:2,name:"diagram.jpg",size:"1.2 MB",analyzed:true,timestamp:"1 hour ago"},
  {id:3,name:"code_review.png",size:"890 KB",analyzed:false,timestamp:"3 hours ago"},
]

export function Vision() {
  const [preview, setPreview] = useState<string|null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [prompt, setPrompt] = useState("")

  const onDrop = useCallback((files: File[])=>{
    const file = files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = e=>{setPreview(e.target?.result as string); setAnalyzed(false)}
    reader.readAsDataURL(file)
  },[])

  const {getRootProps,getInputProps,isDragActive} = useDropzone({onDrop,accept:{"image/*":[".png",".jpg",".jpeg",".webp"]},maxFiles:1})

  const analyze = async()=>{
    setAnalyzing(true)
    await new Promise(r=>setTimeout(r,2000))
    setAnalyzing(false)
    setAnalyzed(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Vision Studio</h1>
        <p className="text-sm text-slate-400 mt-0.5">Upload and analyze images with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!preview ? (
            <div {...getRootProps()}
              className={cn("border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                isDragActive?"border-purple-500 bg-purple-500/10":"border-[#1e2130] hover:border-purple-500/50 hover:bg-[#1a1d2e]")}>
              <input {...getInputProps()}/>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3"/>
              <p className="text-sm font-medium text-white">Drop image here or click to upload</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP — max 10MB</p>
            </div>
          ) : (
            <div className="card p-4">
              <div className="relative rounded-lg overflow-hidden bg-[#0a0b0f] mb-4">
                <img src={preview} alt="Preview" className="w-full max-h-80 object-contain"/>
                <button onClick={()=>{setPreview(null);setAnalyzed(false)}}
                  className="absolute top-2 right-2 bg-[#0f1117]/80 backdrop-blur rounded-lg p-1.5 hover:bg-[#0f1117]">
                  <Trash2 className="w-4 h-4 text-red-400"/>
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ask about this image..." className="input text-sm"/>
                <button onClick={analyze} disabled={analyzing} className="btn-primary whitespace-nowrap">
                  <Eye className="w-4 h-4"/>{analyzing?"Analyzing...":"Analyze"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Describe this image","Extract all text","Find UI components","Identify issues"].map(p=>(
                  <button key={p} onClick={()=>setPrompt(p)} className="text-xs bg-[#1a1d2e] border border-[#1e2130] rounded-full px-3 py-1 text-slate-400 hover:text-white hover:border-purple-500/40 transition-all">{p}</button>
                ))}
              </div>
            </div>
          )}

          {analyzed && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Scan className="w-4 h-4 text-purple-400"/>
                <h3 className="text-sm font-semibold text-white">Analysis Results</h3>
                <span className="badge-green">Complete</span>
              </div>
              <div className="space-y-3">
                {sampleResults.map((r,i)=>(
                  <div key={i} className="p-3 bg-[#1a1d2e] rounded-lg border border-[#1e2130]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{r.label}</span>
                      <span className="text-xs text-emerald-400 font-mono">{r.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-[#0a0b0f] rounded-full mb-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{width:`${r.confidence}%`}}/>
                    </div>
                    <p className="text-xs text-slate-400">{r.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary text-xs py-1.5"><Download className="w-3.5 h-3.5"/>Export</button>
              </div>
            </div>
          )}
        </div>

        <div className="card p-5 h-fit">
          <h3 className="text-sm font-semibold text-white mb-4">Image History</h3>
          <div className="space-y-3">
            {imageHistory.map(img=>(
              <div key={img.id} className="flex items-center gap-3 p-3 bg-[#1a1d2e] rounded-lg hover:bg-[#14161e] transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-[#0a0b0f] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Image className="w-5 h-5 text-slate-500"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{img.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{img.size}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-500">{img.timestamp}</span>
                  </div>
                </div>
                {img.analyzed && <span className="badge-green text-[10px]">Done</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}