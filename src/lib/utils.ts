import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function formatCost(usd: number) { return usd < 0.01 ? `$${(usd*1000).toFixed(3)}m` : `$${usd.toFixed(4)}` }
export function formatTokens(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n) }
export function truncate(str: string, len: number) { return str.length > len ? str.slice(0,len)+"…" : str }
export function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24)
  if(d>0) return `${d}d ago`; if(h>0) return `${h}h ago`; return `${m}m ago`
}