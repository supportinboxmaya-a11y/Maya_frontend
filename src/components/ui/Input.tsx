import { cn } from '@/lib/utils'
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {label?:string;error?:string;icon?:React.ReactNode}
export function Input({label,error,icon,className,...props}:InputProps) {
  return <div className="space-y-1">
    {label && <label className="text-xs font-medium text-slate-400">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
      <input className={cn("input",icon&&"pl-9",error&&"border-red-500/50",className)} {...props}/>
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
}