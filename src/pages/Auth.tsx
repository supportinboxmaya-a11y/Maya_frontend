import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password required'); return }
    setLoading(true); setError('')
    try {
      const { authAPI } = await import('@/lib/api')
      const res: any = await authAPI.login(email, password)
      localStorage.setItem('maya_token', res.access_token)
      navigate('/')
    } catch (err: any) {
      setError(err?.error || err?.message || 'Login failed. Check email/password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0b0f', padding:'1rem'}}>
      <div style={{width:'100%', maxWidth:'380px'}}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">M</div>
          <h1 className="text-2xl font-bold text-white">Maya 2.0 ULTRA</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)}
              type="email" placeholder="admin@maya.ai"
              className="input w-full"/>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)}
              type="password" placeholder="••••••••"
              className="input w-full"/>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
