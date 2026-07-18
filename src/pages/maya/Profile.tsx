import { useState } from "react"
import { Moon, Sun, LogOut, Bell, ChevronRight, Trash2, Check, Send } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Card, Skeleton } from "@/components/maya/ui"
import { useRole } from "@/hooks/useRole"
import { useCostStore } from "@/store"
import { useNotificationStore } from "@/store"
import { meAPI, notificationAPI, authAPI, analyticsAPI } from "@/lib/api"
import { getTheme, setTheme as persistTheme, type Theme } from "@/lib/theme"
import { formatCost, formatTokens, timeAgo } from "@/lib/utils"
import type { Notification } from "@/types"
import toast from "react-hot-toast"

function useProfileData() {
  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => meAPI.get() as Promise<{ name?: string; email?: string; role?: string; created_at?: string }>,
    staleTime: 30_000,
    retry: 1,
  })

  const analyticsQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => analyticsAPI.summary() as Promise<{
      total_cost_usd?: number; total_tokens?: number; total_calls?: number;
      session_start?: string; budget_usd?: number; by_provider?: Record<string, { cost: number; tokens: number; calls: number }>
    }>,
    staleTime: 30_000,
    retry: 1,
  })

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => notificationAPI.unread() as unknown as Promise<Notification[]>,
    staleTime: 15_000,
    retry: 1,
  })

  return { userQuery, analyticsQuery, unreadQuery }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="m-display text-[15px] font-semibold m-ink mb-3">{title}</h2>
      {children}
    </div>
  )
}

export function Profile() {
  const { userQuery, analyticsQuery, unreadQuery } = useProfileData()
  const { isAdmin } = useRole()
  const costSummary = useCostStore((s) => s.costSummary)
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [showAllNotifs, setShowAllNotifs] = useState(false)

  const notifications = useNotificationStore((s) => s.notifications)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const clearAll = useNotificationStore((s) => s.clearAll)
  const addNotification = useNotificationStore((s) => s.addNotification)

  // Load unread into store on fetch
  if (unreadQuery.data && notifications.length === 0) {
    unreadQuery.data.forEach((n) => addNotification(n))
  }

  const user = userQuery.data
  const analytics = analyticsQuery.data

  const handleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setThemeState(next)
    persistTheme(next)
    toast.success(`${next === "dark" ? "Dark" : "Light"} mode`)
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch {
      // best effort
    }
    localStorage.removeItem("maya_token")
    window.location.href = "/auth"
  }

  const markAllNotifs = async () => {
    try {
      await notificationAPI.markAllRead()
      markAllRead()
      toast.success("All marked read")
    } catch {
      toast.error("Failed to mark read")
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 m-rise">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-8">
        <div className="rounded-full m-grad flex items-center justify-center text-white text-lg font-bold" style={{ width: 52, height: 52 }}>
          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          {userQuery.isLoading ? (
            <Skeleton h={20} w="60%" />
          ) : (
            <>
              <h1 className="m-display text-xl font-semibold m-ink">{user?.name || user?.email || "User"}</h1>
              {user?.email && user?.name && <div className="text-sm m-muted">{user.email}</div>}
              <div className="text-[12px] m-muted mt-0.5 flex items-center gap-2">
                <span>{user?.role || "user"}</span>
                {user?.created_at && <><span>·</span><span>Joined {timeAgo(user.created_at)}</span></>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cost summary */}
      <Section title="Usage">
        <Card>
          {analyticsQuery.isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={20} />)}</div>
          ) : analyticsQuery.error ? (
            <div className="p-4 text-sm m-muted">Usage data unavailable.</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm m-ink">Total cost</span>
                <span className="text-sm font-semibold m-ink">{formatCost(analytics?.total_cost_usd ?? costSummary.total_cost_usd ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm m-ink">Tokens used</span>
                <span className="text-sm font-semibold m-ink">{formatTokens(analytics?.total_tokens ?? costSummary.total_tokens ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm m-ink">API calls</span>
                <span className="text-sm font-semibold m-ink">{(analytics?.total_calls ?? costSummary.total_calls ?? 0).toLocaleString()}</span>
              </div>
              {analytics?.by_provider && Object.keys(analytics.by_provider).length > 0 && (
                <div className="px-4 py-3">
                  <div className="text-sm m-ink mb-2">By provider</div>
                  {Object.entries(analytics.by_provider).map(([p, v]) => (
                    <div key={p} className="flex items-center justify-between text-[13px] m-muted py-1">
                      <span>{p}</span>
                      <span>{formatCost(v.cost)} · {formatTokens(v.tokens)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Card>
          {unreadQuery.isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={48} />)}</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm m-muted">No notifications yet.</div>
          ) : (
            <div>
              <div className="flex items-center justify-end gap-2 px-4 pt-2">
                {isAdmin && (
                  <button onClick={async () => {
                    try {
                      await notificationAPI.send("me", "Test", "This is a test notification from Maya.", "info")
                      toast.success("Test notification sent")
                    } catch { toast.error("Failed to send") }
                  }} className="text-[12px] m-accent m-press m-focus flex items-center gap-1">
                    <Send size={12} /> Send test
                  </button>
                )}
                <button onClick={markAllNotifs} className="text-[12px] m-accent m-press m-focus flex items-center gap-1">
                  <Check size={12} /> Mark all read
                </button>
                <button onClick={clearAll} className="text-[12px] m-accent m-press m-focus flex items-center gap-1">
                  <Trash2 size={12} /> Clear all
                </button>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {(showAllNotifs ? notifications : notifications.slice(0, 10)).map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3" style={{ opacity: n.read ? 0.6 : 1 }}>
                    <NotificationIcon type={n.type} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium m-ink">{n.title}</div>
                      {n.message && <div className="text-[12px] m-muted mt-0.5">{n.message}</div>}
                      <div className="text-[11px] m-faint mt-0.5">{timeAgo(n.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {notifications.length > 10 && !showAllNotifs && (
                <button onClick={() => setShowAllNotifs(true)} className="w-full text-center py-2 text-[13px] m-accent m-press m-focus">
                  Show all ({notifications.length})
                </button>
              )}
            </div>
          )}
        </Card>
      </Section>

      {/* Settings */}
      <Section title="Settings">
        <Card className="divide-y divide-[var(--border)]">
          <button onClick={handleTheme} className="w-full text-left flex items-center gap-3 px-4 py-3.5 m-focus m-press">
            {theme === "dark" ? <Sun size={18} className="m-accent" /> : <Moon size={18} className="m-accent" />}
            <span className="flex-1 text-sm m-ink">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            <ChevronRight size={16} className="m-faint" />
          </button>
        </Card>
      </Section>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full m-card rounded-xl px-4 py-3.5 flex items-center gap-3 m-focus m-press"
        style={{ color: "#EF4444", borderColor: "rgba(239,68,68,.2)" }}
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">Log out</span>
      </button>
    </div>
  )
}

function NotificationIcon({ type }: { type: Notification["type"] }) {
  const cls = {
    success: { bg: "rgba(16,185,129,.15)", color: "#10B981" },
    error: { bg: "rgba(239,68,68,.16)", color: "#EF4444" },
    warning: { bg: "rgba(245,158,11,.15)", color: "#F59E0B" },
    info: { bg: "rgba(99,102,241,.12)", color: "var(--accent)" },
  }[type]
  return (
    <span className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: cls.bg, flexShrink: 0 }}>
      <Bell size={14} style={{ color: cls.color }} />
    </span>
  )
}
