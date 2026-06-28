import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { CommandPalette } from '@/components/CommandPalette'

export function Layout() {
  return (
    <div style={{display:'flex', height:'100dvh', overflow:'hidden', background:'#0a0b0f'}}>
      <Sidebar/>
      <div style={{flex:1, display:'flex', flexDirection:'column', marginLeft:0, minWidth:0}} className='md:ml-60'>
        <TopBar/>
        <main style={{flex:1, overflowY:'auto'}}>
          <Outlet/>
        </main>
      </div>
      <CommandPalette/>
    </div>
  )
}
