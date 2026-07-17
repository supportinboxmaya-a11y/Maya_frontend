import { AppShell } from "@/components/maya/AppShell"
import { Auth } from "@/pages/Auth"
import { Routes, Route, Navigate } from 'react-router-dom'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const auth = localStorage.getItem('maya_token')
  if (!auth) return <Navigate to='/auth' replace/>
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path='/auth' element={<Auth/>}/>
      <Route path='/*' element={<PrivateRoute><AppShell/></PrivateRoute>}/>
    </Routes>
  )
}
