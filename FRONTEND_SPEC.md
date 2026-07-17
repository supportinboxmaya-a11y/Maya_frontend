# Maya Frontend — Build Spec (source of truth)

Backend M-2.0 does not change. No endpoint renamed. Frontend only.
Coverage is NOT the problem — endpoint coverage is already ~88%.
The problem is UI shape. Fix these:

## Broken today
1. Two shells at once: old `Layout` (Sidebar+TopBar, 30 pages) and
   `/next` -> `components/maya/AppShell.tsx`, where only pages/maya/Home
   and pages/maya/Chat exist; everything else falls to `Ph` = "Coming next".
   Pick AppShell. Finish it. Delete Layout/Sidebar/TopBar and /next.
2. `config/nav.ts` PRIMARY_NAV has /tasks and /files -> no such routes. Dead taps.
3. AppShell navigates with useState("home"). No router, no deep links, no back.
4. Live is invisible: backend broadcasts real progress, no screen renders it.
5. Admin switches scattered across Settings, LLMProviders, Plugins, Security,
   AdminPanel, Approvals, Scheduler. No single console.
6. useRole defaults to "user", silently degrades on error; ADMIN_ONLY hides nav
   but routes stay reachable.

## Live contract (already exists — use it)
WS `/ws/agent?token=<jwt>` emits:
  connected | pong | task_started {task} | task_progress {task_id,task}
  | task_done {task} | approval_requested {approval}
task = {id,goal,status,current_phase,steps[],provider_used,cost_usd,tokens_used,result,error}
step = {step,title,description,tool,result,success,error}
Keep types in lib/agentLive.ts. task_progress fires on every step_start/step_done.

Build:
- store/live.ts (zustand): tasks by id, feed[] capped 200, connected flag.
- ONE WS at app root feeding it. ping every 25s, backoff reconnect.
- LiveActivity: feed rows = time, goal, phase, TOOL NAME, agent, ok/fail.
- TaskTimeline: steps with tool chip + status dot (stepStatus() exists).
- NowCard: current phase, current tool, elapsed, cost, cancel button.
- Fallback: if WS down, poll /agent/status + /tasks every 3s. Never blank.

## Shape
USER bottom nav (5, thumb-reachable, center raised):
  Home | Tasks | [Ask] | Activity | Profile
  Home = orb + "Idle" or "Running: <goal> - step 2/5, using web_search" + input + recent.
  Ask = chat via /agent/chat/stream, voice /voice/transcribe, image /vision/analyze.
  Tasks = GET /tasks, live rows, tap -> TaskTimeline.
  Activity = LiveActivity. This is the "what is Maya doing" screen for users.
  Profile = /users/me, cost, notifications, theme, logout.
Max 2 taps to any user capability.

ADMIN gets 6th destination "Control":
  Live      - running tasks/agents/tools streaming + cancel /queue/cancel/{id}
  Agents    - /agents, /agents/messages, /agents/orchestrate
  Tools     - /tools, PUT /tools/{name}, /tools/{name}/run, /tools/logs
  Providers - /llm/providers, toggle, PUT key, /llm/strategy, /llm/stats
  Flags     - GET|PUT /flags, every flag a real switch
  Approvals - /approval/mode, /approvals, /approvals/{id}/{decision}
  System    - /health/system, /health/ready, /metrics, /queue/stats, /sync/recent
  Org       - /admin/users, ban, budget, orgs, teams, apikeys, audit, usage

Every switch: read true state on mount, write on change, show pending,
revert + toast on failure. No optimistic-only. No fake switches.

## Wire these unused endpoints
/queue/submit /queue/cancel/{id} /queue/stats /queue/task/{id}
/device/pair/start /device/pair/complete /device/command /device/list
/workspace/memory GET POST DELETE /workspace/stats
/sync/recent /sync/status/{id} /notifications/send /notifications/unread
/health/live /health/ready /health/system /approvals/request
/tools/framework /tools/execute /analytics/tools /memory/summary
/rag/context /admin/roles /plugins/{id}/tools /plugins/{id}/install
/workflows/defs PUT DELETE /workflows/runs/{id}/execute

## Order (each step ships working)
1. Router in AppShell. Delete Layout/Sidebar/TopBar and /next. Fix nav.ts paths.
2. Role gate: useRole via react-query, loading skeleton, RequireAdmin redirect.
3. Live layer. Ship Activity + NowCard first.
4. User surface: Home, Tasks, Ask, Activity, Profile. No stubs.
5. Control console in order: Live, Tools, Providers, Flags, Approvals, System, Org.
6. Wire the orphan endpoints.
7. Delete every Ph placeholder. A destination works or leaves the nav.

## Bar
Mobile-first, 44px taps, bottom nav never covers content (keep pb 76).
Every list: skeleton, empty state with next action, error + retry.
Every mutation: pending, success toast, failure toast + revert.
Keep styles/maya.css tokens (m-card, m-nav, m-ink, m-surface, --accent).
Dark + light both work. build/lint/test clean. No new deps.
