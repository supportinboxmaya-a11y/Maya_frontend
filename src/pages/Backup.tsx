import { useState } from 'react'
import { api } from '@/lib/api'
import { ArchiveRestore, Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function Backup() {
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string|null>(null)
  const [backups, setBackups] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  const fetchBackups = async () => {
    try {
      const data = await api.get('/backup/list')
      setBackups((data as any) || [])
    } catch { setBackups([]) }
    setLoaded(true)
  }

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

  if (!loaded) fetchBackups()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Backup & Restore</h1>
        <button onClick={createBackup} disabled={creating} className="btn-primary">
          {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
          Create Backup
        </button>
      </div>
      {backups.length === 0 ? (
        <div className="text-center text-slate-500 py-20">No backups yet</div>
      ) : (
        <div className="space-y-2">
          {backups.map((b: any) => (
            <div key={b.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-white">{b.name || `Backup ${b.id}`}</div>
                <div className="text-xs text-slate-500">{new Date(b.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => restoreBackup(b.id)} disabled={restoring === b.id}
                className="btn-secondary text-xs py-1.5">
                {restoring === b.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <ArchiveRestore className="w-3 h-3"/>}
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
