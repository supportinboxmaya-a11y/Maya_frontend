# Maya 2.0 ULTRA — Deployment Guide

Two services, deployed separately:

| Service  | Repo                | Host   | URL                                  |
|----------|---------------------|--------|--------------------------------------|
| Backend  | M-2.0               | Render | https://m-2-0.onrender.com           |
| Frontend | Maya_frontend       | Vercel | (your Vercel domain)                 |

## 1. Backend (Render)

Push this repo to GitHub; Render auto-deploys from `render.yaml`.

Required environment variables (Render dashboard → Environment):

| Variable            | Purpose                                          |
|---------------------|--------------------------------------------------|
| `GROQ_API_KEY`      | LLM calls + **voice transcription (Whisper)**    |
| `GEMINI_API_KEY`    | Gemini provider (optional but recommended)       |
| `ADMIN_EMAIL`       | Login email                                      |
| `ADMIN_PASSWORD`    | Login password                                   |
| `SECRET_KEY`        | JWT signing secret (set a long random string)    |
| `FLAG_AUTONOMOUS`   | `true` to enable `/autonomous/run`               |
| `FLAG_TOOL_EXECUTE` | `true` to enable `/tools/execute`                |
| `BUDGET_USD`        | Session budget cap (default `1.0`)               |

### New endpoints added in this release
- `POST /api/v1/voice/transcribe` — real Groq Whisper transcription (base64/data-URL audio)
- `GET/POST/PUT/DELETE /api/v1/webhooks` — outbound webhooks, persisted in `storage/webhooks.json`
  - Fired automatically on `task.started`, `task.done`, `task.failed`
  - Payload: `{ "event": "...", "data": { ...task } }`
- `WS /ws/agent?token=<jwt>` — token is now validated when provided

### Fixes in this release
- `/auth/register` was registered 9× (duplicates removed)
- `/vision/analyze` crashed (500) when Maya was not initialized → now returns 503
- `/analytics/daily` ignored the `days` parameter → now filtered correctly

## 2. Frontend (Vercel)

Push this repo to GitHub; Vercel auto-deploys.

`.env.production` is already correct. If you override env vars in the
Vercel dashboard, they must be:

```
VITE_AGENT_URL=https://m-2-0.onrender.com/api/v1
VITE_WS_URL=wss://m-2-0.onrender.com
VITE_API_URL=https://maya-brain-api2.supportinbox-maya.workers.dev
```

> ⚠️ `VITE_WS_URL` must point at the **Render** backend (previously it
> pointed at the Cloudflare Worker, which has no `/ws/agent` — live
> notifications never worked in production because of this).

## 3. Post-deploy manual test checklist

1. **Login** with admin credentials → lands on Dashboard
2. **Logout** (sidebar) → returns to /auth, refresh does not restore session
3. Dashboard: send a **chat message** → reply appears
4. Dashboard: **attach an image** → vision analysis reply appears
5. Dashboard: **attach a .txt file** → agent summarizes the content
6. Chat/Tasks: create a task → **notification bell badge increments** (proves WebSocket works)
7. Top bar **cost meter** updates after the task completes
8. Memory: add / search / delete a memory
9. Tools: toggle a tool on/off, refresh page → state persists (backend-side)
10. Workflow: **create** a workflow via the new form → run it → task appears
11. Agents page: "Plan (no execution)" returns an orchestration plan
12. Agents page: "Autonomous Run" works after `FLAG_AUTONOMOUS=true`
13. Learning: submit feedback with a star rating → stats update
14. Integrations: **add a webhook** (e.g. a webhook.site URL) → run a task → the URL receives a POST
15. Voice Studio: record audio → transcription appears (requires `GROQ_API_KEY`)
16. Settings: change values, Save, refresh → values restored; switch language to বাংলা → sidebar translates instantly and persists
17. Security: audit log shows admin actions (create org/key)
18. Backend Overview: live metrics / flags / queue panels populate

## Known limitations
- App-connection toggles on the Integrations page (GitHub/Slack/…) are
  device-local preferences; no OAuth integrations exist on the backend yet.
- Only the dark theme exists (the theme selector reflects this honestly).
- In-memory stores (`tasks_db`, `workflows_db`, `backups_db`) reset on
  backend restart by design; webhooks persist to disk.
