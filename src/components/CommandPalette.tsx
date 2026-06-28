import { useEffect, useRef } from 'react'
import { useUIStore } from '@/store'
import { Search, X } from 'lucide-react'

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPalette } = useUIStore()
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPalette(true)
      }
      if (e.key === 'Escape') setCommandPalette(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (commandPaletteOpen) ref.current?.focus()
  }, [commandPaletteOpen])

  if (!commandPaletteOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60'
      onClick={()=>setCommandPalette(false)}>
      <div className='w-full max-w-lg bg-[#14161e] rounded-xl shadow-2xl border border-slate-700'
        onClick={e=>e.stopPropagation()}>
        <div className='flex items-center gap-3 p-4 border-b border-slate-700'>
          <Search className='w-4 h-4 text-slate-400'/>
          <input ref={ref} placeholder='Search pages, actions...'
            className='flex-1 bg-transparent text-white outline-none text-sm placeholder:text-slate-500'/>
          <button onClick={()=>setCommandPalette(false)}>
            <X className='w-4 h-4 text-slate-400'/>
          </button>
        </div>
        <div className='p-2 text-xs text-slate-500 text-center py-8'>Type to search</div>
      </div>
    </div>
  )
}