import { useSearchParams } from "react-router-dom"
import { Gauge, Radio, Users, Wrench, Cpu, Flag, UserCheck, Activity, Building2, MonitorSmartphone, Layers } from "lucide-react"
import { LivePanel } from "@/components/control/LivePanel"
import { AgentsPanel } from "@/components/control/AgentsPanel"
import { ToolsPanel } from "@/components/control/ToolsPanel"
import { ProvidersPanel } from "@/components/control/ProvidersPanel"
import { FlagsPanel } from "@/components/control/FlagsPanel"
import { ApprovalsPanel } from "@/components/control/ApprovalsPanel"
import { SystemPanel } from "@/components/control/SystemPanel"
import { OrgPanel } from "@/components/control/OrgPanel"
import { DevicePanel } from "@/components/control/DevicePanel"
import { WorkspacePanel } from "@/components/control/WorkspacePanel"

const TABS = [
  { id: "live",      label: "Live",      icon: Radio },
  { id: "agents",    label: "Agents",    icon: Users },
  { id: "tools",     label: "Tools",     icon: Wrench },
  { id: "providers", label: "Providers", icon: Cpu },
  { id: "flags",     label: "Flags",     icon: Flag },
  { id: "approvals", label: "Approvals", icon: UserCheck },
  { id: "devices",   label: "Devices",   icon: MonitorSmartphone },
  { id: "workspace", label: "Workspace", icon: Layers },
  { id: "system",    label: "System",    icon: Activity },
  { id: "org",       label: "Org",       icon: Building2 },
] as const

type TabId = (typeof TABS)[number]["id"]

const PANELS: Record<TabId, React.FC> = {
  live: LivePanel,
  agents: AgentsPanel,
  tools: ToolsPanel,
  providers: ProvidersPanel,
  flags: FlagsPanel,
  approvals: ApprovalsPanel,
  devices: DevicePanel,
  workspace: WorkspacePanel,
  system: SystemPanel,
  org: OrgPanel,
}

export function Control() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get("tab") as TabId) || "live"
  const Panel = PANELS[tab] || LivePanel

  const setTab = (id: TabId) => {
    setSearchParams({ tab: id }, { replace: true })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 m-rise">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="m-accent-soft rounded-xl p-2.5 inline-flex"><Gauge size={20} className="m-accent" /></span>
        <h1 className="m-display text-2xl font-semibold m-ink">Control</h1>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 overflow-x-auto m-hide-sb mb-6 pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-on={tab === t.id}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap m-focus transition-colors"
            style={{
              background: tab === t.id ? "var(--accent-soft)" : "transparent",
              color: tab === t.id ? "var(--accent)" : "var(--muted)",
            }}
          >
            <t.icon size={15} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Active panel */}
      <Panel />
    </div>
  )
}
