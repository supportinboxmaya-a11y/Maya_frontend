import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Loader2, Download, Power } from 'lucide-react'
import type { Plugin } from '@/types'
import toast from 'react-hot-toast'

export function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/plugins').then((data: any) => setPlugins(data || []))
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false))
  }, [])

  const togglePlugin = async (plugin: Plugin) => {
    try {
      await api.put(`/plugins/${plugin.id}`, { enabled: !plugin.enabled })
      setPlugins(prev => prev.map(p => p.id === plugin.id ? {...p, enabled: !p.enabled} : p))
      toast.success(`${plugin.name} ${!plugin.enabled ? 'enabled' : 'disabled'}`)
    } catch { toast.error('Failed to update plugin') }
  }

  const installPlugin = async (plugin: Plugin) => {
    try {
      await api.post(`/plugins/${plugin.id}/install`, {})
      setPlugins(prev => prev.map(p => p.id === plugin.id ? {...p, installed: true} : p))
      toast.success(`${plugin.name} installed`)
    } catch { toast.error('Install failed') }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-bold text-white">Plugin Marketplace</h1>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : plugins.length === 0 ? (
        <div className="text-center text-slate-500 py-20">⚠️ No plugins available — backend offline</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plugins.map(plugin => (
            <div key={plugin.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{plugin.name}</div>
                  <div className="text-xs text-slate-500">{plugin.author} • v{plugin.version}</div>
                </div>
                <span className="badge badge-default text-[10px]">{plugin.category}</span>
              </div>
              <div className="text-xs text-slate-400">{plugin.description}</div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-xs text-yellow-400">★ {plugin.rating}</span>
                  <span className="text-xs text-slate-600">{plugin.downloads} downloads</span>
                </div>
                {plugin.installed ? (
                  <button onClick={() => togglePlugin(plugin)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${plugin.enabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                    <Power className="w-3 h-3"/>{plugin.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                ) : (
                  <button onClick={() => installPlugin(plugin)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors">
                    <Download className="w-3 h-3"/>Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
