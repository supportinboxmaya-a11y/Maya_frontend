import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2, Github, Mail, Lock, User, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type Mode = "login"|"register"|"forgot"

export function Auth() {
  const [mode, setMode] = useState<Mode>("login")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if(!email || !password) { setError("Please fill all fields"); return }
    setLoading(true)
    setError("")
    await new Promise(r=>setTimeout(r,1500))
    setLoading(false)
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-r border-[#1e2130] flex-col items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">M</div>
            <div>
              <div className="text-xl font-bold text-white">Maya</div>
              <div className="text-sm text-slate-400 font-mono">2.0 ULTRA</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Your AI<br/>Operating System
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Autonomous agents, multi-model intelligence, and powerful workflows — all in one place.
          </p>
          <div className="space-y-4">
            {[
              {icon:"🧠", title:"Multi-Layer Memory", desc:"Remembers everything across sessions"},
              {icon:"🔧", title:"35+ Built-in Tools", desc:"Web search, code execution, file management"},
              {icon:"⚡", title:"6 LLM Providers", desc:"Groq, Gemini, OpenAI, Claude, DeepSeek"},
              {icon:"🔄", title:"Workflow Builder", desc:"Automate complex multi-step tasks"},
            ].map(f=>(
              <div key={f.title} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">M</div>
            <span className="text-lg font-bold text-white">Maya 2.0 ULTRA</span>
          </div>

          {/* Card */}
          <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl p-8">
            {/* Tabs */}
            <div className="flex gap-1 bg-[#14161e] rounded-xl p-1 mb-6">
              {(["login","register"] as Mode[]).map(m=>(
                <button key={m} onClick={()=>{setMode(m);setError("")}}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                    mode===m?"bg-[#0f1117] text-white shadow-sm":"text-slate-500 hover:text-slate-300")}>
                  {m}
                </button>
              ))}
            </div>

            {mode==="forgot" ? (
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-sm text-slate-400 mb-6">Enter your email to receive a reset link.</p>
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                    <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" className="input pl-10"/>
                  </div>
                  <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full justify-center py-2.5">
                    {loading && <Loader2 className="w-4 h-4 animate-spin"/>}Send Reset Link
                  </button>
                  <button onClick={()=>setMode("login")} className="w-full text-sm text-slate-400 hover:text-white transition-colors">← Back to login</button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{mode==="login"?"Welcome back":"Create account"}</h2>
                <p className="text-sm text-slate-400 mb-6">{mode==="login"?"Sign in to your Maya workspace":"Start your AI operating system"}</p>

                {/* OAuth */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button className="btn-secondary justify-center py-2.5 text-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button className="btn-secondary justify-center py-2.5 text-xs">
                    <Github className="w-4 h-4"/>GitHub
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-[#1e2130]"/>
                  <span className="text-xs text-slate-500">or continue with email</span>
                  <div className="flex-1 h-px bg-[#1e2130]"/>
                </div>

                <div className="space-y-4">
                  {mode==="register" && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="input pl-10"/>
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                    <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" className="input pl-10"/>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                    <input value={password} onChange={e=>setPassword(e.target.value)} type={showPass?"text":"password"} placeholder="Password" className="input pl-10 pr-10"/>
                    <button onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                    </button>
                  </div>

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  {mode==="login" && (
                    <div className="flex justify-end">
                      <button onClick={()=>setMode("forgot")} className="text-xs text-purple-400 hover:text-purple-300">Forgot password?</button>
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full justify-center py-2.5">
                    {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
                    <Zap className="w-4 h-4"/>
                    {mode==="login"?"Sign In":"Create Account"}
                  </button>
                </div>

                {mode==="register" && (
                  <p className="text-xs text-slate-500 text-center mt-4">
                    By creating an account you agree to our Terms of Service.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}