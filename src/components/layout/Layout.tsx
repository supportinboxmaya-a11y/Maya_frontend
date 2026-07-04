import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { CommandPalette } from '@/components/CommandPalette'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useNotificationStore, useTaskStore, useCostStore } from '@/store'
import { analyticsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export function Layout() {
  const addNotification = useNotificationStore(s => s.addNotification)
  const updateTask = useTaskStore(s => s.updateTask)
  const setCostSummary = useCostStore(s => s.setCostSummary)

  const refreshCost = () => {
    analyticsAPI.summary().then((s: any) => s && setCostSummary(s)).catch(() => {})
  }

  const notifyEnabled = () => {
    try { return JSON.parse(localStorage.getItem('maya_settings') || '{}').notifyTaskDone !== false }
    catch { return true }
  }

  useWebSocket((data: any) => {
    if (!data || typeof data !== 'object') return
    if (!notifyEnabled()) {
      if (data.type === 'task_done' && data.task) { updateTask(data.task.id, data.task); refreshCost() }
      return
    }
    if (data.type === 'task_started' && data.task) {
      addNotification({ id: `${Date.now()}-s`, type: 'info', title: 'Task started',
        message: data.task.goal || '', timestamp: new Date().toISOString(), read: false } as any)
    }
    if (data.type === 'task_done' && data.task) {
      const ok = data.task.status === 'done'
      updateTask(data.task.id, data.task)
      addNotification({ id: `${Date.now()}-d`, type: ok ? 'success' : 'error',
        title: ok ? 'Task completed' : 'Task failed',
        message: data.task.goal || '', timestamp: new Date().toISOString(), read: false } as any)
      toast[ok ? 'success' : 'error'](ok ? 'Task completed' : 'Task failed')
      refreshCost()
    }
  })

  useEffect(() => { refreshCost() }, [])

  return (
    <div style={{display:'flex', height:'100dvh', width:'100vw', maxWidth:'100vw', overflow:'hidden', background:'#0a0b0f'}}>
      <Sidebar/>
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0, maxWidth:'100%', overflow:'hidden'}} className='md:ml-60'>
        <TopBar/>
        <main style={{flex:1, overflowY:'auto', overflowX:'hidden'}}>
          <Outlet/>
        </main>
      </div>
      <CommandPalette/>
    </div>
  )
}
