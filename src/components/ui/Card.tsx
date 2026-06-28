import { cn } from '@/lib/utils'
export function Card({children,className,hover,onClick}:{children:React.ReactNode;className?:string;hover?:boolean;onClick?:()=>void}) {
  return <div className={cn(hover?"card-hover":"card",onClick&&"cursor-pointer",className)} onClick={onClick}>{children}</div>
}