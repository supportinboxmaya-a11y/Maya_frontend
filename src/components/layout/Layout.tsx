import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { CommandPalette } from '@/components/CommandPalette'

export function Layout() {
  return (
    <div className='flex h-screen bg-[#0a0b0f] overflow-hidden'>
      <Sidebar/>
      <div className='flex-1 flex flex-col md:ml-60 min-w-0'>
        <TopBar/>
        <main className='flex-1 overflow-y-auto p-4 md:p-6'>
          <Outlet/>
        </main>
      </div>
      <CommandPalette/>
    </div>
  )
}
