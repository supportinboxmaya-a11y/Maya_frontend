import { cn } from '@/lib/utils'
type Variant = "purple"|"blue"|"green"|"red"|"yellow"|"default"
const variants:Record<Variant,string> = {
  purple:"badge bg-purple-500/15 text-purple-400 border border-purple-500/20",
  blue:"badge bg-blue-500/15 text-blue-400 border border-blue-500/20",
  green:"badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  red:"badge bg-red-500/15 text-red-400 border border-red-500/20",
  yellow:"badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  default:"badge bg-[#1a1d2e] text-slate-400 border border-[#1e2130]"
}
export function Badge({children,variant="default",className}:{children:React.ReactNode;variant?:Variant;className?:string}) {
  return <span className={cn(variants[variant],className)}>{children}</span>
}