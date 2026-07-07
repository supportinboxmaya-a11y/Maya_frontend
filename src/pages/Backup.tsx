import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ArchiveRestore, Plus, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function Backup() {
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBackups = async () => {
    try {
      const data = await api.get('/backup/list')
      setBackups((data as any) || [])
    } catch { setBackups([]) }
    setLoading(false)
  }
  // Was previously called directly in the render body (`if (!loaded) fetchBackups()`)
  // instead of an effect, which could fire multiple overlapping requests before
  // the first one resolved. useEffect runs it exactly once per mount instead.
  useEffect(() => { fetchBackups() }, [])

  const createBackup = async () => {
    setCreating(true)
    try {
      await api.post('/backup/create', {})
      toast.success('Backup created!')
      fetchBackups()
    } catch { toast.error('Backup failed') }
    finally { setCreating(false) }
  }

  const restoreBackup = async (id: string) => {
    setRestoring(id)
    try {
      await api.post(`/backup/restore/${id}`, {})
      toast.success('Restored successfully!')
    } catch { toast.error('Restore failed') }
    finally { setRestoring(null) }
  }

  const deleteBackup = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return
    setDeleting(id)
    try {
      await api.delete(`/backup/${id}`)
      setBackups(prev => prev.filter(b => b.id !== id))
      toast.success('Backup deleted')
    } catch { toast.error('Failed to delete backup') }
    finally { setDeleting(null) }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Backup & Restore</h1>
        <button onClick={createBackup} disabled={creating} className="btn-primary">
          {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
          Create Backup
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400"/></div>
      ) : backups.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No backups yet</div>
      ) : (
        <div className="space-y-2">
          {backups.map((b: any) => (
            <div key={b.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{b.name || `Backup ${b.id}`}</div>
                <div className="text-xs text-slate-500">{new Date(b.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => restoreBackup(b.id)} disabled={restoring === b.id}
                  className="btn-secondary text-xs py-1.5">
                  {restoring === b.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <ArchiveRestore className="w-3 h-3"/>}
                  Restore
                </button>
                <button onClick={() => deleteBackup(b.id, b.name)} disabled={deleting === b.id}
                  className="text-slate-500 hover:text-red-400 transition-colors">
                  {deleting === b.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
