import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password required'); return }
    setLoading(true); setError('')
    try {
      const { authAPI } = await import('@/lib/api')
      const res: any = mode === 'login'
        ? await authAPI.login(email, password)
        : await authAPI.register(name, email, password)
      localStorage.setItem('maya_token', res.access_token)
      navigate('/')
    } catch (err: any) {
      setError(err?.detail || err?.error || err?.message ||
        (mode === 'login' ? 'Login failed. Check email/password.' : 'Registration failed.'))
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
          <p className="text-sm text-slate-400 mt-1">{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
          {mode === 'register' && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Name</label>
              <input value={name} onChange={e=>setName(e.target.value)}
                type="text" placeholder="Your name"
                className="input w-full"/>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)}
              type="email" placeholder="you@example.com"
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
            {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          className="w-full text-center text-sm text-slate-500 hover:text-slate-300 mt-4 transition-colors">
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
