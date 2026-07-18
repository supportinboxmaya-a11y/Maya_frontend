import { useEffect, useRef, useState } from "react"
import { Search, Bell, Sun, Moon, Command, Boxes, ChevronRight, MessageSquare } from "lucide-react"
import { PRIMARY_NAV, ADVANCED, ALL_DEST, ADMIN_ONLY } from "@/config/nav"
import { getTheme, setTheme as persist, type Theme } from "@/lib/theme"
import { useRole } from "@/hooks/useRole"
import { Orb } from "./Orb"
import { LiveConnection } from "@/components/live/LiveConnection"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import { Home } from "@/pages/maya/Home"
import { Chat } from "@/pages/maya/Chat"
import { Tasks } from "@/pages/maya/Tasks"
import { Activity } from "@/pages/maya/Activity"
import { Profile } from "@/pages/maya/Profile"
import { RequireAdmin } from "@/components/auth/RequireAdmin"

export function AppShell() {
  const { isAdmin } = useRole()
  const [theme, setTheme] = useState<Theme>(getTheme())
  const [advOpen, setAdvOpen] = useState(false)
  const [pal, setPal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { persist(theme) }, [theme])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal((v) => !v) }
      if (e.key === "Escape") setPal(false)
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [])

  const canSee = (id: string) => isAdmin || !ADMIN_ONLY.has(id)
  const currentPath = location.pathname
  const isActive = (path: string) => currentPath === path

  const go = (path: string) => {
    if (path === "/chat" || path === "/tasks" || path === "/activity" || path === "/profile" || path === "/") {
      navigate(path)
    } else {
      navigate(path)
    }
  }

  const primary = isAdmin ? PRIMARY_NAV : PRIMARY_NAV.filter((n) => n.id !== "tools")

  return (<div className="maya-app" data-theme={theme} style={{ height: "100dvh", display: "flex", overflow: "hidden" }}>
    <LiveConnection />
    <aside className="hidden md:flex flex-col m-bd-r m-surface" style={{ width: 256, flexShrink: 0 }}>
      <div className="flex items-center gap-2.5 px-5" style={{ height: 64 }}><Orb size={26} /><span className="m-display text-lg font-semibold m-ink">Maya</span></div>
      <nav className="flex-1 overflow-y-auto m-hide-sb px-3 space-y-1">
        {primary.map((n) => (<button key={n.id} className="m-nav m-focus" data-on={isActive(n.path)} onClick={() => go(n.path)}><n.icon size={18} /><span>{n.label}</span></button>))}
        {isAdmin && (<>
          <button className="m-nav m-focus" onClick={() => setAdvOpen((v) => !v)}><Boxes size={18} /><span className="flex-1">Advanced</span><ChevronRight size={15} style={{ transform: advOpen ? "rotate(90deg)" : "none" }} /></button>
          {advOpen && ADVANCED.map((s) => (<div key={s.g} className="mb-1"><div className="text-[11px] font-semibold m-faint uppercase px-3 pt-2 pb-1" style={{ letterSpacing: ".05em" }}>{s.g}</div>{s.items.map((i) => (<button key={i.id} className="m-nav m-focus" data-on={isActive(i.path)} onClick={() => go(i.path)}><i.icon size={16} /><span className="text-[13px]">{i.label}</span></button>))}</div>))}
        </>)}
      </nav>
      <div className="p-3 m-bd-t"><div className="m-nav" style={{ cursor: "default" }}><div className="rounded-full m-grad flex items-center justify-center text-white text-xs font-semibold" style={{ width: 32, height: 32 }}>{isAdmin ? "A" : "U"}</div><div className="text-sm font-medium m-ink">{isAdmin ? "Admin" : "You"}</div></div></div>
    </aside>
    <div className="flex-1 flex flex-col min-w-0">
      <header className="m-bd-b m-surface flex items-center gap-3 px-4 md:px-6" style={{ height: 64, flexShrink: 0 }}>
        <div className="md:hidden flex items-center gap-2"><Orb size={24} /><span className="m-display font-semibold m-ink">Maya</span></div>
        <button onClick={() => setPal(true)} className="hidden md:flex items-center gap-2 m-sunken m-bd rounded-xl px-3.5 py-2 text-sm m-muted m-focus m-press" style={{ width: 288 }}><Search size={16} /><span className="flex-1 text-left">Search anything</span><kbd className="text-[11px] m-mono flex items-center gap-0.5"><Command size={11} />K</kbd></button>
        <div className="flex-1" />
        <button aria-label="s" onClick={() => setPal(true)} className="md:hidden p-2 rounded-xl m-press m-focus m-muted"><Search size={20} /></button>
        <button aria-label="t" onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")} className="p-2 rounded-xl m-press m-focus m-muted">{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}</button>
        <button aria-label="n" className="p-2 rounded-xl m-press m-focus m-muted"><Bell size={19} /></button>
      </header>
      <main className="flex-1 overflow-y-auto m-hide-sb" style={{ paddingBottom: 76 }}>
        <Routes>
          <Route index element={<Home />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="chat" element={<Chat admin={isAdmin} />} />
          <Route path="activity" element={<Activity />} />
          <Route path="profile" element={<Profile />} />
          {ADVANCED.flatMap((s) => s.items).filter((d) => canSee(d.id)).map((d) => (
            <Route key={d.id} path={d.path.slice(1)} element={<RequireAdmin><Ph id={d.id} /></RequireAdmin>} />
          ))}
        </Routes>
      </main>
    </div>
    <nav className="md:hidden m-surface m-bd-t flex items-end justify-around px-2 pt-2 pb-3" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30 }}>
      {primary.map((n) => {
        const on = isActive(n.path)
        if (n.id === "chat") return (<button key={n.id} onClick={() => go(n.path)} className="m-press m-focus flex flex-col items-center" style={{ marginTop: -24 }}><span className="m-grad rounded-2xl p-3.5 m-shadow"><MessageSquare size={22} color="#fff" /></span></button>)
        return (<button key={n.id} onClick={() => go(n.path)} className="m-press m-focus flex flex-col items-center gap-1 py-1 px-3"><n.icon size={21} style={{ color: on ? "var(--accent)" : "var(--muted)" }} /><span className="text-[10px] font-medium" style={{ color: on ? "var(--accent)" : "var(--faint)" }}>{n.label}</span></button>)
      })}
    </nav>
    {pal && <Pal isAdmin={isAdmin} onClose={() => setPal(false)} go={(path) => { setPal(false); navigate(path) }} />}
  </div>)
}

function Ph({ id }: { id: string }) {
  const d = ALL_DEST.find((x) => x.id === id)
  return (<div className="max-w-3xl mx-auto px-4 md:px-6 py-6 m-rise"><div className="flex items-center gap-3 mb-2">{d?.icon && <span className="m-accent-soft rounded-xl p-2.5"><d.icon size={20} className="m-accent" /></span>}<h1 className="m-display text-2xl font-semibold m-ink">{d?.label || id}</h1></div><p className="text-sm m-muted mb-6">Rebuilt next — existing features & endpoints stay intact.</p><div className="m-card p-8 text-center"><div className="text-sm m-muted">Coming next.</div></div></div>)
}

function Pal({ isAdmin, onClose, go }: { isAdmin: boolean; onClose: () => void; go: (path: string) => void }) {
  const [q, setQ] = useState("")
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 40) }, [])
  const res = ALL_DEST.filter((d) => (isAdmin || !ADMIN_ONLY.has(d.id)) && d.label.toLowerCase().includes(q.toLowerCase()))
  return (<div style={{ position: "fixed", inset: 0, zIndex: 50, paddingTop: "12vh", background: "rgba(10,12,18,.5)", display: "flex", justifyContent: "center", padding: "12vh 16px 0" }} onClick={onClose}><div className="m-card m-shadow m-rise" style={{ width: "100%", maxWidth: 512, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-3 px-4 m-bd-b"><Search size={18} className="m-faint" /><input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="flex-1 bg-transparent outline-none py-4 text-[15px] m-ink" /></div><div className="m-hide-sb p-2" style={{ maxHeight: 320, overflowY: "auto" }}>{res.map((d) => (<button key={d.id} onClick={() => go(d.path)} className="m-nav m-focus"><d.icon size={16} /><span className="flex-1 text-[14px]">{d.label}</span><span className="text-[11px] m-faint">{d.group}</span></button>))}</div></div></div>)
}
