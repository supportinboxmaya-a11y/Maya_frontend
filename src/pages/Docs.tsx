import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { FileText, Loader2, ChevronLeft } from 'lucide-react'

export function Docs() {
  const [docs, setDocs] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/docs').then((r: any) => setDocs(r?.docs || [])).catch(() => setDocs([])).finally(() => setLoading(false))
  }, [])

  const open = async (name: string) => {
    setActive(name); setContent('')
    try { setContent(((await api.get(`/docs/${name}`)) as any)?.content || '') }
    catch { setContent('Could not load this document.') }
  }

  return (
    <div className="p-5 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        {active && <button onClick={() => setActive(null)} className="btn-secondary !min-h-[40px] !px-3"><ChevronLeft className="w-4 h-4"/></button>}
        <h1 className="flex items-center gap-2"><FileText className="w-6 h-6 text-purple-400"/>{active || 'Documentation'}</h1>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div> :
        !active ? (
          docs.length === 0 ? <div className="card p-8 text-center text-sm text-slate-500">No documents found.</div> : (
            <div className="card divide-y divide-[#262b3f]">
              {docs.map(d => (
                <button key={d} onClick={() => open(d)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#1a1d2e]">
                  <FileText className="w-4 h-4 text-slate-500"/><span className="text-[15px] text-slate-200">{d}</span>
                </button>))}
            </div>
          )
        ) : (
          <div className="card p-5"><pre className="text-[14px] text-slate-200 whitespace-pre-wrap font-sans">{content || '...'}</pre></div>
        )}
    </div>
  )
}
