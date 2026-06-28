import { StatusDot } from "@/components/ui/StatusDot"

const providers = [
  {name:"groq",model:"llama-3.3-70b",available:true,latency:1240},
  {name:"gemini",model:"gemini-1.5-flash",available:true,latency:750},
  {name:"deepseek",model:"deepseek-coder",available:true,latency:980},
  {name:"openai",model:"gpt-4o",available:false,latency:0},
  {name:"claude",model:"claude-3-haiku",available:true,latency:1800},
  {name:"local",model:"ollama",available:false,latency:0},
]

export function ProviderHealth() {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Provider Health</h3>
      <div className="space-y-3">
        {providers.map(p=>(
          <div key={p.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status={p.available?"online":"offline"}/>
              <span className="text-sm text-white capitalize font-medium">{p.name}</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400">{p.model}</div>
              {p.available
                ? <div className="text-xs text-slate-500">{p.latency}ms</div>
                : <div className="text-xs text-red-400">Offline</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}