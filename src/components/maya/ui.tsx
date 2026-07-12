import type { ReactNode } from "react"
export function Card({ className = "", children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={`m-card ${hover ? "m-lift" : ""} ${className}`}>{children}</div>
}
export function Skeleton({ h = 16, w = "100%" as number | string }) { return <div className="m-skel" style={{ height: h, width: w }} /> }
