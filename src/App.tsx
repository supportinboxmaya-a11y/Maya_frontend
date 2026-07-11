import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { Loader2 } from 'lucide-react'

// Everything past the first paint is code-split so the initial bundle only
// has to include Auth + Dashboard + Layout — the rest loads on navigation.
const Chat = lazy(() => import('@/pages/Chat').then(m => ({ default: m.Chat })))
const Memory = lazy(() => import('@/pages/Memory').then(m => ({ default: m.Memory })))
const Knowledge = lazy(() => import('@/pages/Knowledge').then(m => ({ default: m.Knowledge })))
const Workspaces = lazy(() => import('@/pages/Workspaces').then(m => ({ default: m.Workspaces })))
const LiveChat = lazy(() => import('@/components/chat/LiveChat').then(m => ({ default: m.LiveChat })))
const Tools = lazy(() => import('@/pages/Tools').then(m => ({ default: m.Tools })))
const Analytics = lazy(() => import('@/pages/Analytics').then(m => ({ default: m.Analytics })))
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })))
const Notifications = lazy(() => import('@/pages/Notifications').then(m => ({ default: m.Notifications })))
const Voice = lazy(() => import('@/pages/Voice').then(m => ({ default: m.Voice })))
const Vision = lazy(() => import('@/pages/Vision').then(m => ({ default: m.Vision })))
const Workflow = lazy(() => import('@/pages/Workflow').then(m => ({ default: m.Workflow })))
const Scheduler = lazy(() => import('@/pages/Scheduler').then(m => ({ default: m.Scheduler })))
const Projects = lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })))
const DeviceBridge = lazy(() => import('@/pages/DeviceBridge').then(m => ({ default: m.DeviceBridge })))
const Plugins = lazy(() => import('@/pages/Plugins').then(m => ({ default: m.Plugins })))
const Security = lazy(() => import('@/pages/Security').then(m => ({ default: m.Security })))
const BackendOverview = lazy(() => import('@/pages/BackendOverview').then(m => ({ default: m.BackendOverview })))
const BackendLogs = lazy(() => import('@/pages/BackendLogs').then(m => ({ default: m.BackendLogs })))
const Cost = lazy(() => import('@/pages/Cost').then(m => ({ default: m.Cost })))
const Team = lazy(() => import('@/pages/Team').then(m => ({ default: m.Team })))
const Testing = lazy(() => import('@/pages/Testing').then(m => ({ default: m.Testing })))
const Backup = lazy(() => import('@/pages/Backup').then(m => ({ default: m.Backup })))
const Integrations = lazy(() => import('@/pages/Integrations').then(m => ({ default: m.Integrations })))
const Learning = lazy(() => import('@/pages/Learning').then(m => ({ default: m.Learning })))
const Agents = lazy(() => import('@/pages/Agents').then(m => ({ default: m.Agents })))
const AdminPanel = lazy(() => import('@/pages/AdminPanel').then(m => ({ default: m.AdminPanel })))
const Approvals = lazy(() => import('@/pages/Approvals').then(m => ({ default: m.Approvals })))
const LLMProviders = lazy(() => import('@/pages/LLMProviders').then(m => ({ default: m.LLMProviders })))
const Prompts = lazy(() => import('@/pages/Prompts').then(m => ({ default: m.Prompts })))
const Skills = lazy(() => import('@/pages/Skills').then(m => ({ default: m.Skills })))
const Docs = lazy(() => import('@/pages/Docs').then(m => ({ default: m.Docs })))

function PrivateRoute({ children }) {
  const auth = localStorage.getItem('maya_token')
  if (!auth) return <Navigate to='/auth' replace/>
  return children
}

function RouteLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin text-purple-400"/>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader/>}>
      <Routes>
        <Route path='/auth' element={<Auth/>}/>
        <Route path='/' element={<PrivateRoute><Layout/></PrivateRoute>}>
          <Route index element={<Dashboard/>}/>
          <Route path='chat' element={<Chat/>}/>
          <Route path='memory' element={<Memory/>}/>
          <Route path='knowledge' element={<Knowledge/>}/>
          <Route path='workspaces' element={<Workspaces/>}/>
          <Route path='live' element={<LiveChat/>}/>
          <Route path='tools' element={<Tools/>}/>
          <Route path='analytics' element={<Analytics/>}/>
          <Route path='cost' element={<Cost/>}/>
          <Route path='workflow' element={<Workflow/>}/>
          <Route path='scheduler' element={<Scheduler/>}/>
          <Route path='projects' element={<Projects/>}/>
          <Route path='device-bridge' element={<DeviceBridge/>}/>
          <Route path='agents' element={<Agents/>}/>
          <Route path='learning' element={<Learning/>}/>
          <Route path='admin' element={<AdminPanel/>}/>
          <Route path='approvals' element={<Approvals/>}/>
          <Route path='llm' element={<LLMProviders/>}/>
          <Route path='prompts' element={<Prompts/>}/>
          <Route path='skills' element={<Skills/>}/>
          <Route path='docs' element={<Docs/>}/>
          <Route path='plugins' element={<Plugins/>}/>
          <Route path='voice' element={<Voice/>}/>
          <Route path='vision' element={<Vision/>}/>
          <Route path='backend/overview' element={<BackendOverview/>}/>
          <Route path='backend/logs' element={<BackendLogs/>}/>
          <Route path='team' element={<Team/>}/>
          <Route path='security' element={<Security/>}/>
          <Route path='testing' element={<Testing/>}/>
          <Route path='backup' element={<Backup/>}/>
          <Route path='integrations' element={<Integrations/>}/>
          <Route path='notifications' element={<Notifications/>}/>
          <Route path='settings' element={<Settings/>}/>
        </Route>
      </Routes>
    </Suspense>
  )
}
