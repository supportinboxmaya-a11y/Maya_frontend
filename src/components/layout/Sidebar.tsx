import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard,MessageSquare,Brain,Wrench,BarChart3,Settings,Shield,GitBranch,Puzzle,Mic,Eye,Terminal,Bell,Users,DollarSign,Activity,TestTube,ArchiveRestore,Globe,X,Menu,Plus,Trash2,LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const navSections = [
  {label:'Core',items:[
    {to:'/chat',icon:MessageSquare,label:'Chat / Tasks'},
    {to:'/memory',icon:Brain,label:'Memory Center'},
    {to:'/tools',icon:Wrench,label:'Tool Manager'},
    {to:'/analytics',icon:BarChart3,label:'Analytics'},
    {to:'/cost',icon:DollarSign,label:'Cost & Budget'},
  ]},
  {label:'Build',items:[
    {to:'/workflow',icon:GitBranch,label:'Workflow Builder'},
    {to:'/plugins',icon:Puzzle,label:'Plugin Marketplace'},
  ]},
  {label:'AI Studio',items:[
    {to:'/voice',icon:Mic,label:'Voice Studio'},
    {to:'/vision',icon:Eye,label:'Vision Studio'},
  ]},
  {label:'Backend',items:[
    {to:'/backend/overview',icon:Activity,label:'Backend Overview'},
    {to:'/backend/logs',icon:Terminal,label:'Logs'},
  ]},
  {label:'Enterprise',items:[
    {to:'/team',icon:Users,label:'Team Workspace'},
    {to:'/security',icon:Shield,label:'Security Center'},
    {to:'/testing',icon:TestTube,label:'Testing Console'},
    {to:'/backup',icon:ArchiveRestore,label:'Backup & Restore'},
    {to:'/integrations',icon:Globe,label:'Integrations'},
  ]},
  {label:'System',items:[
    {to:'/notifications',icon:Bell,label:'Notifications'},
    {to:'/settings',icon:Settings,label:'Settings'},
  ]},
]

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [chats, setChats] = useState<{id:string;title:string;time:string;messages:unknown[]}[]>([])
  const [activeChat, setActiveChat] = useState<string|null>(null)
  const navigate = useNavigate()

  useEffect(()=>{
    const stored = JSON.parse(localStorage.getItem('maya_chats')||'[]')
    setChats(stored)
    const active = localStorage.getItem('maya_active_chat')
    if (active) setActiveChat(active)
  },[])

  const newChat = () => {
    const id = Date.now().toString()
    const chat = {id, title:'New Chat', time:new Date().toLocaleTimeString(), messages:[]}
    const updated = [chat, ...chats]
    setChats(updated)
    localStorage.setItem('maya_chats', JSON.stringify(updated))
    localStorage.setItem('maya_active_chat', id)
    localStorage.setItem('maya_chat', '[]')
    setActiveChat(id)
    setOpen(false)
    navigate('/')
  }

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = chats.filter(c=>c.id!==id)
    setChats(updated)
    localStorage.setItem('maya_chats', JSON.stringify(updated))
    if (activeChat===id) {
      localStorage.removeItem('maya_active_chat')
      localStorage.setItem('maya_chat', '[]')
      setActiveChat(null)
    }
  }

  const selectChat = (chat) => {
    setActiveChat(chat.id)
    localStorage.setItem('maya_active_chat', chat.id)
    localStorage.setItem('maya_chat', JSON.stringify(chat.messages||[]))
    setOpen(false)
    navigate('/')
    window.dispatchEvent(new Event('maya_chat_changed'))
  }

  const logout = () => {
    localStorage.removeItem('maya_auth')
    navigate('/auth')
  }

  return (
    <>
      <button onClick={()=>setOpen(true)}
        className='md:hidden fixed top-3 left-3 z-50 p-2 bg-[#0f1117] border border-[#1e2130] rounded-lg text-slate-400'>
        <Menu className='w-5 h-5'/>
      </button>
      {open && <div className='md:hidden fixed inset-0 bg-black/60 z-40' onClick={()=>setOpen(false)}/>}
      <aside className={cn(
        'fixed top-0 left-0 h-screen w-60 bg-[#0f1117] border-r border-[#1e2130] flex flex-col z-50 transition-transform duration-200',
        'md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className='flex items-center justify-between p-4 border-b border-[#1e2130]'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm'>M</div>
            <div><div className='text-sm font-bold text-white'>Maya</div><div className='text-xs text-slate-500 font-mono'>2.0 ULTRA</div></div>
          </div>
          <button onClick={()=>setOpen(false)} className='md:hidden text-slate-400'><X className='w-5 h-5'/></button>
        </div>

        <div className='p-2'>
          <button onClick={newChat} className='w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-white text-sm font-medium'>
            <Plus className='w-4 h-4'/> New Chat
          </button>
        </div>

        <nav className='flex-1 overflow-y-auto py-2 space-y-4 px-2'>
          {chats.length>0 && (
            <div>
              <div className='text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1'>Recent Chats</div>
              <div className='space-y-0.5'>
                {chats.slice(0,5).map(chat=>(
                  <div key={chat.id} onClick={()=>selectChat(chat)}
                    className={cn('flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-all',
                      activeChat===chat.id?'bg-purple-500/15 border border-purple-500/20':'hover:bg-[#1a1d2e]')}>
                    <span className='text-xs text-slate-400 truncate flex-1'>{chat.title}</span>
                    <button onClick={(e)=>deleteChat(chat.id,e)} className='opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 ml-1'>
                      <Trash2 className='w-3 h-3'/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {navSections.map(s=>(
            <div key={s.label}>
              <div className='text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1'>{s.label}</div>
              <div className='space-y-0.5'>
                {s.items.map(item=>(
                  <NavLink key={item.to} to={item.to} onClick={()=>setOpen(false)}>
                    {({isActive})=>(
                      <div className={cn(isActive?'sidebar-item-active':'sidebar-item')}>
                        <item.icon className='w-4 h-4 flex-shrink-0'/><span className='truncate'>{item.label}</span>
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className='p-3 border-t border-[#1e2130]'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400'>A</div>
              <div className='flex-1 min-w-0'>
                <div className='text-xs font-medium text-white'>Admin</div>
                <div className='text-xs text-slate-500'>admin@maya.ai</div>
              </div>
            </div>
            <button onClick={logout} className='text-slate-500 hover:text-red-400 transition-colors'>
              <LogOut className='w-4 h-4'/>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
