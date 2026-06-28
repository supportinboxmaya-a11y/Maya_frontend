import { cn } from '@/lib/utils'
type Status = "online"|"offline"|"error"|"warning"
const cls: Record<Status,string> = {
  online:"w-2 h-2 rounded-full bg-emerald-400 animate-pulse",
  offline:"w-2 h-2 rounded-full bg-slate-500",
  error:"w-2 h-2 rounded-full bg-red-400 animate-pulse",
  warning:"w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
}
export function StatusDot({status,className}:{status:Status;className?:string}) {
  return <span className={cn(cls[status],className)}/>
}