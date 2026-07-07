import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Loader2, Power, Trash2, Puzzle } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoadedPlugin {
  name: string
  description: string
  version: string
  tools: string[]
  enabled: boolean
}

export function Plugins() {
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlugins = () => {
    setLoading(true)
    api.get('/plugins').then((data: any) => setPlugins(data || []))
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchPlugins() }, [])

  const togglePlugin = async (plugin: LoadedPlugin) => {
    try {
      await api.put(`/plugins/${plugin.name}`, { enabled: !plugin.enabled })
      setPlugins(prev => prev.map(p => p.name === plugin.name ? { ...p, enabled: !p.enabled } : p))
      toast.success(`${plugin.name} ${!plugin.enabled ? 'enabled' : 'disabled'}`)
    } catch { toast.error('Failed to update plugin') }
  }

  const deletePlugin = async (plugin: LoadedPlugin) => {
    if (!window.confirm(`Delete plugin "${plugin.name}"? This removes its file from the server.`)) return
    try {
      await api.delete(`/plugins/${plugin.name}`)
      setPlugins(prev => prev.filter(p => p.name !== plugin.name))
      toast.success(`${plugin.name} deleted`)
    } catch { toast.error('Failed to delete plugin') }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><Puzzle className="w-5 h-5 text-purple-400"/>Plugins</h1>
        <button onClick={fetchPlugins} className="btn-secondary text-sm">Refresh</button>
      </div>
      <p className="text-xs text-slate-500">
        Plugins are .py files dropped into the server's <code className="text-purple-400">plugins/</code> folder.
        There's no install-from-catalog yet — this just manages what's already loaded.
      </p>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : plugins.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No plugins loaded.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plugins.map(plugin => (
            <div key={plugin.name} className="card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{plugin.name}</div>
                  <div className="text-xs text-slate-500">v{plugin.version}</div>
                </div>
                {plugin.tools?.length > 0 && <span className="badge badge-default text-[10px]">{plugin.tools.length} tool{plugin.tools.length !== 1 && 's'}</span>}
              </div>
              {plugin.description && <div className="text-xs text-slate-400">{plugin.description}</div>}
              <div className="flex items-center justify-between">
                <button onClick={() => togglePlugin(plugin)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${plugin.enabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Power className="w-3 h-3"/>{plugin.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button onClick={() => deletePlugin(plugin)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
