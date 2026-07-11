import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/store'
import { Search, X, CornerDownLeft } from 'lucide-react'

const pages = [
  { path: '/', label: 'Dashboard' },
  { path: '/chat', label: 'Chat / Tasks' },
  { path: '/memory', label: 'Memory Center' },
  { path: '/tools', label: 'Tool Manager' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/cost', label: 'Cost & Budget' },
  { path: '/workflow', label: 'Workflow Builder' },
  { path: '/scheduler', label: 'Scheduler' },
  { path: '/projects', label: 'Projects' },
  { path: '/device-bridge', label: 'Device Bridge' },
  { path: '/workspaces', label: 'Workspaces' },
  { path: '/agents', label: 'Agent Command' },
  { path: '/learning', label: 'Learning Center' },
  { path: '/plugins', label: 'Plugin Marketplace' },
  { path: '/voice', label: 'Voice Studio' },
  { path: '/vision', label: 'Vision Studio' },
  { path: '/backend/overview', label: 'Backend Overview' },
  { path: '/backend/logs', label: 'Logs' },
  { path: '/team', label: 'Team Workspace' },
  { path: '/security', label: 'Security Center' },
  { path: '/testing', label: 'Testing Console' },
  { path: '/backup', label: 'Backup & Restore' },
  { path: '/integrations', label: 'Integrations' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/settings', label: 'Settings' },
]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPalette } = useUIStore()
  const ref = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  const results = pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))

  const go = (path: string) => {
    navigate(path)
    setCommandPalette(false)
    setQuery('')
    setSelected(0)
  }

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
    if (commandPaletteOpen) { ref.current?.focus(); setSelected(0) }
  }, [commandPaletteOpen])

  useEffect(() => { setSelected(0) }, [query])

  if (!commandPaletteOpen) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) go(results[selected].path)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60'
      onClick={()=>setCommandPalette(false)}>
      <div className='w-full max-w-lg bg-[#14161e] rounded-xl shadow-2xl border border-slate-700'
        onClick={e=>e.stopPropagation()}>
        <div className='flex items-center gap-3 p-4 border-b border-slate-700'>
          <Search className='w-4 h-4 text-slate-400'/>
          <input ref={ref} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={onKeyDown}
            placeholder='Go to page...'
            className='flex-1 bg-transparent text-white outline-none text-sm placeholder:text-slate-500'/>
          <button onClick={()=>setCommandPalette(false)}>
            <X className='w-4 h-4 text-slate-400'/>
          </button>
        </div>
        <div className='max-h-72 overflow-y-auto p-2'>
          {results.length === 0 ? (
            <div className='text-center text-xs text-slate-500 py-6'>No pages match "{query}"</div>
          ) : results.map((p, i) => (
            <button key={p.path} onClick={()=>go(p.path)} onMouseEnter={()=>setSelected(i)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                i === selected ? 'bg-purple-500/15 text-white' : 'text-slate-400 hover:bg-[#1a1d2e]'}`}>
              <span>{p.label}</span>
              {i === selected && <CornerDownLeft className='w-3.5 h-3.5 text-slate-500'/>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
