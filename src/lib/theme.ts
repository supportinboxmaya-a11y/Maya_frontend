export type Theme = "light" | "dark"
const K = "maya_theme"
export function getTheme(): Theme { try { const t = localStorage.getItem(K) as Theme; return t === "dark" || t === "light" ? t : "light" } catch { return "light" } }
export function setTheme(t: Theme) { try { localStorage.setItem(K, t) } catch {} }
