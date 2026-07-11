import { NavLink, useNavigate } from 'react-router-dom'
import { MessageSquare,Brain,Database,Zap,Wrench,BarChart3,Settings,Shield,GitBranch,Puzzle,Mic,Eye,Terminal,Bell,Users,DollarSign,Activity,TestTube,ArchiveRestore,Globe,X,Plus,Trash2,LogOut,Bot,GraduationCap,ShieldCheck,UserCheck,Cpu,BookOpenText,Sparkles,FileText,Clock,Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

const navSections = [
  {label:'sectionCore',items:[
    {to:'/chat',icon:MessageSquare,label:'chat'},
    {to:'/memory',icon:Brain,label:'memory'},
    {to:'/knowledge',icon:Database,label:'knowledge'},
    {to:'/workspaces',icon:Layers,label:'workspaces'},
    {to:'/live',icon:Zap,label:'liveChat'},
    {to:'/tools',icon:Wrench,label:'tools'},
    {to:'/analytics',icon:BarChart3,label:'analytics'},
    {to:'/cost',icon:DollarSign,label:'cost'},
  ]},
  {label:'sectionBuild',items:[
    {to:'/workflow',icon:GitBranch,label:'workflow'},
    {to:'/scheduler',icon:Clock,label:'scheduler'},
    {to:'/plugins',icon:Puzzle,label:'plugins'},
  ]},
  {label:'sectionIntelligence',items:[
    {to:'/agents',icon:Bot,label:'agents'},
    {to:'/learning',icon:GraduationCap,label:'learning'},
  ]},
  {label:'sectionAiStudio',items:[
    {to:'/voice',icon:Mic,label:'voice'},
    {to:'/vision',icon:Eye,label:'vision'},
  ]},
  {label:'sectionBackend',items:[
    {to:'/backend/overview',icon:Activity,label:'backendOverview'},
    {to:'/backend/logs',icon:Terminal,label:'logs'},
  ]},
  {label:'sectionEnterprise',items:[
    {to:'/team',icon:Users,label:'team'},
    {to:'/security',icon:Shield,label:'security'},
    {to:'/testing',icon:TestTube,label:'testing'},
    {to:'/backup',icon:ArchiveRestore,label:'backup'},
    {to:'/integrations',icon:Globe,label:'integrations'},
  ]},
  {label:'sectionControl',items:[
    {to:'/admin',icon:ShieldCheck,label:'admin'},
    {to:'/approvals',icon:UserCheck,label:'approvals'},
    {to:'/llm',icon:Cpu,label:'llmProviders'},
    {to:'/prompts',icon:BookOpenText,label:'prompts'},
    {to:'/skills',icon:Sparkles,label:'skillsPage'},
    {to:'/docs',icon:FileText,label:'docs'},
  ]},
  {label:'sectionSystem',items:[
    {to:'/notifications',icon:Bell,label:'notifications'},
    {to:'/settings',icon:Settings,label:'settings'},
  ]},
]

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [chats, setChats] = useState<{id:string;title:string;time:string;messages:unknown[]}[]>([])
  const [activeChat, setActiveChat] = useState<string|null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(()=>{
    const openHandler = () => setOpen(true)
    window.addEventListener('maya_open_sidebar', openHandler)
    return () => window.removeEventListener('maya_open_sidebar', openHandler)
  },[])

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

  const logout = async () => {
    try {
      const { authAPI } = await import('@/lib/api')
      await authAPI.logout()
    } catch { /* best-effort; token is cleared locally regardless */ }
    localStorage.removeItem('maya_token')
    navigate('/auth')
  }

  const [me, setMe] = useState<{email?: string; role?: string} | null>(null)
  useEffect(() => {
    (async () => {
      try {
        const { meAPI } = await import('@/lib/api')
        const res: any = await meAPI.get()
        setMe(res)
      } catch { /* fall back to defaults below */ }
    })()
  }, [])

  return (
    <>
      <div
        className={cn(
          'md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setOpen(false)}
      />
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
            <Plus className='w-4 h-4'/> {t('newChat')}
          </button>
        </div>

        <nav className='flex-1 min-h-0 overflow-y-auto py-2 space-y-4 px-2'>
          {chats.length>0 && (
            <div>
              <div className='text-[12px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1.5'>{t('recentChats')}</div>
              <div className='space-y-0.5'>
                {chats.slice(0,5).map(chat=>(
                  <div key={chat.id} onClick={()=>selectChat(chat)}
                    className={cn('flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer group transition-all',
                      activeChat===chat.id?'bg-purple-500/15 border border-purple-500/20':'hover:bg-[#1a1d2e]')}>
                    <span className='text-sm text-slate-300 truncate flex-1'>{chat.title}</span>
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
              <div className='text-[12px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1.5'>{t(s.label)}</div>
              <div className='space-y-0.5'>
                {s.items.map(item=>(
                  <NavLink key={item.to} to={item.to} onClick={()=>setOpen(false)}>
                    {({isActive})=>(
                      <div className={cn(isActive?'sidebar-item-active':'sidebar-item')}>
                        <item.icon className='w-4 h-4 flex-shrink-0'/><span className='truncate'>{t(item.label)}</span>
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
              <div className='w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400'>
                {(me?.email?.[0] || 'A').toUpperCase()}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-xs font-medium text-white truncate'>{me?.role === 'admin' ? 'Admin' : (me?.role || 'Admin')}</div>
                <div className='text-xs text-slate-500 truncate'>{me?.email || 'admin@maya.ai'}</div>
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
