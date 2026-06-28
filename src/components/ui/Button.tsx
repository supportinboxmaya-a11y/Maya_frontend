import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:"primary"|"secondary"|"ghost"|"danger"; loading?:boolean; icon?:React.ReactNode
}
const variants = {
  primary:"btn-primary",secondary:"btn-secondary",ghost:"btn-ghost",
  danger:"bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
}
export function Button({variant="primary",loading,icon,children,className,disabled,...props}:ButtonProps) {
  return <button className={cn(variants[variant],className)} disabled={disabled||loading} {...props}>
    {loading?<Loader2 className="w-4 h-4 animate-spin"/>:icon}{children}
  </button>
}