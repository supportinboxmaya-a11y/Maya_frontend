import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { Chat } from '@/pages/Chat'
import { Memory } from '@/pages/Memory'
import { Tools } from '@/pages/Tools'
import { Analytics } from '@/pages/Analytics'
import { Settings } from '@/pages/Settings'
import { Notifications } from '@/pages/Notifications'
import { Voice } from '@/pages/Voice'
import { Vision } from '@/pages/Vision'
import { Workflow } from '@/pages/Workflow'
import { Plugins } from '@/pages/Plugins'
import { Security } from '@/pages/Security'
import { BackendOverview } from '@/pages/BackendOverview'
import { BackendLogs } from '@/pages/BackendLogs'
import { Cost } from '@/pages/Cost'
import { Team } from '@/pages/Team'
import { Testing } from '@/pages/Testing'
import { Backup } from '@/pages/Backup'
import { Integrations } from '@/pages/Integrations'
import { Learning } from '@/pages/Learning'
import { Agents } from '@/pages/Agents'

function PrivateRoute({ children }) {
  const auth = localStorage.getItem('maya_token')
  if (!auth) return <Navigate to='/auth' replace/>
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path='/auth' element={<Auth/>}/>
      <Route path='/' element={<PrivateRoute><Layout/></PrivateRoute>}>
        <Route index element={<Dashboard/>}/>
        <Route path='chat' element={<Chat/>}/>
        <Route path='memory' element={<Memory/>}/>
        <Route path='tools' element={<Tools/>}/>
        <Route path='analytics' element={<Analytics/>}/>
        <Route path='cost' element={<Cost/>}/>
        <Route path='workflow' element={<Workflow/>}/>
        <Route path='agents' element={<Agents/>}/>
        <Route path='learning' element={<Learning/>}/>
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
  )
}
